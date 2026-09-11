/** "1 word", "3 words", "1 activity", "2 activities" */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
