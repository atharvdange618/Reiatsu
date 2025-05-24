import { IncomingMessage, ServerResponse } from "http";
import { Context } from "../types/http";

export function createContext(
  req: IncomingMessage,
  res: ServerResponse,
  query: Record<string, string | string[]>
): Context {
  const noop = () => {
    throw new Error("Helper not initialized");
  };
  const ctx = {
    req,
    res,
    params: {} as any,
    query,
    requestId: undefined,
    status: (code: number) => {
      res.statusCode = code;
      return ctx;
    },
    json: (data: unknown) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    },
    send: noop,
    html: noop,
    text: noop,
    xml: noop,
    redirect: noop,
    cookie: noop,
    download: noop,
    render: noop,
  };
  return ctx;
}
