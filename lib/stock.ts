import { Prisma } from "@prisma/client";
import { dateOnlyKey } from "@/lib/dates";

type Tx = Prisma.TransactionClient;

export type StockMovementInput = {
  productId: string;
  userId: string;
  type: "ENTRADA" | "SAIDA";
  reason:
    | "COMPRA"
    | "AJUSTE"
    | "DEVOLUCAO"
    | "VENDA"
    | "PERDA"
    | "QUEBRA"
    | "CONSUMO_INTERNO";
  quantity: number;
  movementDate: Date;
  observation?: string | null;
};

async function lockProduct(tx: Tx, productId: string) {
  await tx.$queryRaw(
    Prisma.sql`
      SELECT id
      FROM "products"
      WHERE id = ${productId}
      FOR UPDATE
    `
  );

  const product = await tx.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Produto não encontrado.");
  }

  return product;
}

async function negativeStockAllowed(tx: Tx) {
  const settings = await tx.setting.findFirst({
    select: {
      allowNegativeStock: true,
    },
  });

  return settings?.allowNegativeStock ?? false;
}

export async function applyStockMovement(
  tx: Tx,
  input: StockMovementInput
) {
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity <= 0
  ) {
    throw new Error(
      "A quantidade deve ser um número inteiro maior que zero."
    );
  }

  const product = await lockProduct(
    tx,
    input.productId
  );

  if (product.status !== "ATIVO") {
    throw new Error(
      `${product.name} está inativo.`
    );
  }

  const latest =
    await tx.stockMovement.findFirst({
      where: {
        productId: input.productId,
      },
      orderBy: [
        {
          movementDate: "desc",
        },
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      select: {
        movementDate: true,
      },
    });

  if (
    latest &&
    input.movementDate <
      latest.movementDate
  ) {
    const latestDate = dateOnlyKey(
      latest.movementDate
    )
      .split("-")
      .reverse()
      .join("/");

    throw new Error(
      `Não é possível registrar esta movimentação em uma data anterior ao histórico do produto. ` +
        `A última movimentação de “${product.name}” está em ${latestDate}. ` +
        `Para lançar uma data anterior, estorne primeiro as movimentações mais recentes desse produto, da última para a primeira.`
    );
  }

  const previousStock =
    product.currentStock;

  const delta =
    input.type === "ENTRADA"
      ? input.quantity
      : -input.quantity;

  const newStock =
    previousStock + delta;

  if (
    newStock < 0 &&
    !(await negativeStockAllowed(tx))
  ) {
    throw new Error(
      `Estoque insuficiente para ${product.name}. Disponível: ${previousStock} ${product.unit}.`
    );
  }

  const movement =
    await tx.stockMovement.create({
      data: {
        productId: input.productId,
        userId: input.userId,
        type: input.type,
        reason: input.reason,
        quantity: input.quantity,
        previousStock,
        newStock,
        movementDate:
          input.movementDate,
        observation:
          input.observation?.trim() ||
          null,
      },
    });

  const updatedProduct =
    await tx.product.update({
      where: {
        id: input.productId,
      },
      data: {
        currentStock: newStock,
      },
    });

  await tx.auditLog.create({
    data: {
      userId: input.userId,
      action:
        "STOCK_MOVEMENT_CREATED",
      entity: "StockMovement",
      entityId: movement.id,
      oldValue: {
        stock: previousStock,
      },
      newValue: {
        stock: newStock,
        productId: input.productId,
        type: input.type,
        reason: input.reason,
        quantity: input.quantity,
        movementDate: dateOnlyKey(
          input.movementDate
        ),
      },
    },
  });

  return {
    movement,
    product: updatedProduct,
  };
}

export async function revertLatestMovement(
  tx: Tx,
  movementId: string,
  userId: string
) {
  const movement =
    await tx.stockMovement.findUnique({
      where: {
        id: movementId,
      },
      include: {
        product: true,
      },
    });

  if (!movement) {
    throw new Error(
      "Movimentação não encontrada."
    );
  }

  await lockProduct(
    tx,
    movement.productId
  );

  const latest =
    await tx.stockMovement.findFirst({
      where: {
        productId:
          movement.productId,
      },
      orderBy: [
        {
          movementDate: "desc",
        },
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      select: {
        id: true,
      },
    });

  if (latest?.id !== movement.id) {
    throw new Error(
      "Por segurança, somente a última movimentação do produto pode ser estornada. Estorne as movimentações mais recentes primeiro."
    );
  }

  const currentProduct =
    await tx.product.findUniqueOrThrow(
      {
        where: {
          id: movement.productId,
        },
      }
    );

  if (
    currentProduct.currentStock !==
    movement.newStock
  ) {
    throw new Error(
      "O saldo atual diverge do histórico. Faça a conferência de estoque antes de estornar."
    );
  }

  await tx.product.update({
    where: {
      id: movement.productId,
    },
    data: {
      currentStock:
        movement.previousStock,
    },
  });

  await tx.stockMovement.delete({
    where: {
      id: movement.id,
    },
  });

  await tx.auditLog.create({
    data: {
      userId,
      action:
        "STOCK_MOVEMENT_REVERTED",
      entity: "StockMovement",
      entityId: movement.id,
      oldValue: {
        productId:
          movement.productId,
        type: movement.type,
        reason: movement.reason,
        quantity:
          movement.quantity,
        movementDate:
          dateOnlyKey(
            movement.movementDate
          ),
        stock: movement.newStock,
      },
      newValue: {
        stock:
          movement.previousStock,
      },
    },
  });

  return {
    productId:
      movement.productId,
    restoredStock:
      movement.previousStock,
  };
}

export async function reconcileProduct(
  tx: Tx,
  productId: string
) {
  const product =
    await tx.product.findUnique({
      where: {
        id: productId,
      },
    });

  if (!product) {
    throw new Error(
      "Produto não encontrado."
    );
  }

  const movements =
    await tx.stockMovement.findMany({
      where: {
        productId,
      },
      orderBy: [
        {
          movementDate: "asc",
        },
        {
          createdAt: "asc",
        },
        {
          id: "asc",
        },
      ],
      select: {
        type: true,
        quantity: true,
        previousStock: true,
        newStock: true,
      },
    });

  if (movements.length === 0) {
    return {
      productId,
      productName:
        product.name,
      storedStock:
        product.currentStock,
      calculatedStock:
        product.currentStock,
      consistent: true,
      historyConsistent: true,
    };
  }

  let calculatedStock =
    movements[0].previousStock;

  let historyConsistent =
    true;

  for (const movement of movements) {
    if (
      movement.previousStock !==
      calculatedStock
    ) {
      historyConsistent = false;
    }

    calculatedStock +=
      movement.type === "ENTRADA"
        ? movement.quantity
        : -movement.quantity;

    if (
      movement.newStock !==
      calculatedStock
    ) {
      historyConsistent = false;
    }
  }

  return {
    productId,
    productName: product.name,
    storedStock:
      product.currentStock,
    calculatedStock,
    consistent:
      product.currentStock ===
        calculatedStock &&
      historyConsistent,
    historyConsistent,
  };
}