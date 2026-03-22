const TRAILING_FILENAME_PUNCTUATION_PATTERN = /[ \t]*[.,;:!。，；：！]+[ \t]*$/u;

export function sanitizeFilenameBasename(fileBasename: string): string {
  return fileBasename.replace(TRAILING_FILENAME_PUNCTUATION_PATTERN, "");
}

export function buildRenamedFilePath(
  filePath: string,
  oldBasename: string,
  newBasename: string,
  extension: string
): string {
  const oldFileName = `${oldBasename}.${extension}`;

  if (!filePath.endsWith(oldFileName)) {
    return filePath;
  }

  return `${filePath.slice(0, -oldFileName.length)}${newBasename}.${extension}`;
}
