export type JSONTrace = {
  micros?: number,
  start?: number,
  stop?: number,
  calls?: JSONTrace[],
}

export class Trace {
  readonly name: string;

  micros?: number;
  startTime?: number;
  stopTime?: number;
  // eslint-disable-next-line no-use-before-define
  calls: Trace[];

  constructor(name: string, calls: Trace[] = []) {
    this.name = name;
    this.calls = calls;
  }

  addCall(trace: Trace) {
    this.calls.push(trace);
  }

  createCall(name: string) {
    const trace = new Trace(name);

    this.addCall(trace);

    return trace;
  }

  getCall(name: string) {
    return this.calls.find((x) => x.name === name);
  }

  startCall(name: string) {
    const trace = this.getCall(name);
    if (!trace) throw new Error(`no such call ${name}`);

    trace.start();

    return trace;
  }

  stopCall(name: string) {
    const trace = this.getCall(name);
    if (!trace) throw new Error(`no such call ${name}`);

    trace.stop();

    return trace;
  }

  start() {
    this.startTime = performance.now();
  }

  stop() {
    if (!this.startTime) throw new Error(`attempted to stop trace ${this.name} but it wasn't started`);
    this.stopTime = performance.now();

    this.micros = (this.stopTime - this.startTime);
  }

  getMicros() {
    let total = 0;

    if (this.micros) total += this.micros;
    if (this.calls) {
      this.calls.forEach((x) => {
        total += x.getMicros();
      });
    }

    return total;
  }

  toGatewayObject() {
    const jsonTraces: any[] = [this.name, {
      micros: this.getMicros(),
      calls: this.calls.map((x) => x.toGatewayObject()).flat(),
    }];

    return jsonTraces;
  }
}

export class Tracer {
  name: string;

  traces: Record<string, Trace> = {};

  constructor(name = "unnamed-trace") {
    this.name = name;
  }

  createTrace(name: string) {
    const trace = new Trace(name);
    this.traces[name] = trace;

    return trace;
  }

  getTrace(name: string) {
    return this.traces[name];
  }

  startTrace(name: string) {
    this.traces[name] ??= this.createTrace(name);
    const trace = this.getTrace(name)!;

    trace.start();

    return trace;
  }

  stopTrace(name: string) {
    const trace = this.getTrace(name);

    if (!trace) throw new Error(`no such trace ${name}`);

    trace.stop();

    return trace;
  }

  stopAndStart(name: string, newTrace: string) {
    this.stopTrace(name);
    return this.startTrace(newTrace);
  }

  toGatewayObject() {
    const jsonTraces = [this.name, {
      micros: Object.values(this.traces)
        .filter((x) => !!x.micros)
        .map((x) => x.micros)
        .reduce((x, y) => (x! + y!)),
      calls: Object.values(this.traces).map((x) => x.toGatewayObject()).flat(),
    }];

    // const otherTraces = Object.entries(this.traces).flat();
    // jsonTraces.push(...otherTraces);

    return jsonTraces;
  }
}
