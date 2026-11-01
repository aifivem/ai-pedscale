export const range = (min: number, max: number) => ({
  type: "number" as const,
  min,
  max,
});
