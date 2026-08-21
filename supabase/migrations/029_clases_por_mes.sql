-- Migration 029: cuota mensual de clases por alumno
-- Nullable: solo aplica cuando está seteada (ej: estudio-pronoia).
-- Gyms sin este valor no ven ningún cambio de comportamiento.

ALTER TABLE public.alumnos ADD COLUMN IF NOT EXISTS clases_por_mes INT;
