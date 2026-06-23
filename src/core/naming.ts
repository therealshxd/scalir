/** Build the output filename: prefix + stem + ext.
 *  If newExt is null the original extension is preserved. */
export function makeOutName(name: string, prefix: string, newExt: string | null): string {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = newExt != null ? newExt : dot > 0 ? name.slice(dot) : '';
  return `${prefix}${stem}${ext}`;
}
