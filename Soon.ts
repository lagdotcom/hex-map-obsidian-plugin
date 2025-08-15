type Handle = ReturnType<typeof setTimeout>;

export default class Soon {
  handle?: Handle;

  constructor(public callback: () => void) {}

  schedule() {
    if (this.handle) this.cancel();
    this.handle = setTimeout(this.callback);
  }

  cancel() {
    clearTimeout(this.handle);
    this.handle = undefined;
  }
}
