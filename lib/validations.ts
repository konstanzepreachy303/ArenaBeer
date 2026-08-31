import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2),
  internalCode: z.string().min(1),
  unit: z.enum(["UNIDADE", "CAIXA", "PACOTE", "LITRO", "KG"]),
  currentStock: z.coerce.number().int().min(0),
  minimumStock: z.coerce.number().int().min(0),
  status: z.enum(["ATIVO", "INATIVO"]),
});

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "OPERADOR"]),
  status: z.enum(["ATIVO", "INATIVO"]),
});
