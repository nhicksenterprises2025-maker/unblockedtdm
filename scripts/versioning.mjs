export function packageSemverFor(displayVersion) {
  const version = String(displayVersion ?? '').trim();
  const numericParts = version.split('.');
  if (numericParts.length > 3 && numericParts.every((part) => /^\d+$/.test(part))) {
    return `${numericParts.slice(0, 3).join('.')}-${numericParts.slice(3).join('.')}`;
  }
  return version;
}
