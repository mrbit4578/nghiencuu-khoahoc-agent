import { z } from "zod";
const paper = z.object({
  id: z.string().max(300),
  title: z.string().max(5000),
  year: z.number().nullable(),
  authors: z.array(z.string().max(300)).max(1000),
  doi: z.string().max(300).nullable(),
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://")),
  citations: z.number(),
  venue: z.string().max(1000),
  abstract: z.string().max(100000),
  openAccess: z.boolean(),
});
export const projectSchema = z.object({
  id: z.string().max(100),
  title: z.string().min(1).max(300),
  notes: z.string().max(500000),
  skills: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(177),
  papers: z.array(paper).max(500),
  updated: z.string().max(50),
});
export const projectsSchema = z.array(projectSchema).max(100);
