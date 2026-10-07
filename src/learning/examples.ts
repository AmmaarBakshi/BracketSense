/** Preloaded inputs for the Visualizer, Playground and Presentation Mode. */
export interface Example {
  id: string
  label: string
  input: string
  group: 'start' | 'errors' | 'code'
  note: string
}

export const JS_EXAMPLE = `function groupBy(items, keyFn) {
  const groups = {};
  for (const item of items) {
    const key = keyFn(item);
    (groups[key] ||= []).push(item);
  }
  return Object.entries(groups).map(([k, v]) => ({ key: k, count: v.length }));
}`

export const C_EXAMPLE = `#include <stdio.h>

int main(void) {
    int grid[3][3] = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    int total = 0;
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            if (grid[i][j] % 2 == 0) {
                total += grid[i][j];
            }
        }
    }
    printf("%d\\n", total);
    return 0;
}`

/** Section 2.2 of the report. */
export const PY_EXAMPLE = `def calculate(a, b):
    result = (a + b) * [1, 2, 3][0]
    return result`

export const EXAMPLES: readonly Example[] = [
  { id: 'nested', label: '{[()]}', input: '{[()]}', group: 'start', note: 'Report Figure 1: three pushes, three pops' },
  { id: 'pair', label: '()', input: '()', group: 'start', note: 'The smallest balanced input' },
  { id: 'siblings', label: '()[]{}', input: '()[]{}', group: 'start', note: 'Pairs side by side: max stack size 1' },
  { id: 'crossed', label: '([)]', input: '([)]', group: 'errors', note: 'Wrong type: ) arrives while [ is on top' },
  { id: 'unclosed', label: '((', input: '((', group: 'errors', note: 'Unclosed: 2 left on the Stack' },
  { id: 'unmatched', label: '))', input: '))', group: 'errors', note: 'Unmatched: the Stack is empty' },
  { id: 'deep-cross', label: '{[(])}', input: '{[(])}', group: 'errors', note: 'Wrong type in the middle of nesting' },
  { id: 'expr', label: 'a[i] = (b + c) * {d - e}', input: 'a[i] = (b + c) * {d - e}', group: 'code', note: 'Report section 8: 18 characters ignored' },
  { id: 'js', label: 'JS function', input: JS_EXAMPLE, group: 'code', note: 'Real JavaScript with nested calls and objects' },
  { id: 'c', label: 'C nested loops', input: C_EXAMPLE, group: 'code', note: 'C function with nested for-loops and a 2-D array' },
  { id: 'py', label: 'Python (report 2.2)', input: PY_EXAMPLE, group: 'code', note: 'The editor example from the report' },
]

export const EXAMPLE_GROUPS: ReadonlyArray<{ id: Example['group']; label: string; level: string }> = [
  { id: 'start', label: 'Start here', level: 'Easy' },
  { id: 'errors', label: 'Find the error', level: 'Medium' },
  { id: 'code', label: 'Real code', level: 'Hard' },
]

export const DEFAULT_INPUT = '{[()]}'
