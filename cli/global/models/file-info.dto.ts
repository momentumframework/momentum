export class FileInfo {
  readonly pathRelativeToUserDirectory!: string;
  readonly pathAbsolute!: string;
  readonly isFile!: boolean;
  readonly isDirectory!: boolean;
  readonly exists!: boolean;

  constructor(data?: Partial<FileInfo>) {
    this.isFile = false;
    this.isDirectory = false;
    this.exists = false;

    Object.assign(this, data);
  }
}
