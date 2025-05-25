import { Middleware } from "../types/http";
import { readFileSync, statSync } from "fs";
import { extname, basename } from "path";
import { render, renderFile } from "../core/template-engine";

export const responseHelpersMiddleware: Middleware = async (ctx, next) => {
  ctx.status = (code) => {
    ctx.res.statusCode = code;
    return ctx;
  };

  ctx.send = (body, type = "application/octet-stream") => {
    ctx.res.setHeader("Content-Type", type);
    ctx.res.end(body);
  };

  ctx.text = (body) => ctx.send(body, "text/plain; charset=utf-8");

  ctx.html = (body) => ctx.send(body, "text/html; charset=utf-8");

  ctx.xml = (body) => ctx.send(body, "application/xml; charset=utf-8");

  ctx.json = (data) => {
    ctx.res.setHeader("Content-Type", "application/json");
    ctx.res.end(JSON.stringify(data));
  };

  ctx.redirect = (url: string, status = 302) => {
    ctx.res.writeHead(status, { Location: url });
    ctx.res.end();
  };

  ctx.cookie = (name, value, options = {}) => {
    const opts = [
      `Path=${options.path ?? "/"}`,
      options.maxAge != null ? `Max-Age=${options.maxAge}` : null,
      options.domain ? `Domain=${options.domain}` : null,
      options.secure ? `Secure` : null,
      options.httpOnly ? `HttpOnly` : null,
      options.sameSite ? `SameSite=${options.sameSite}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    ctx.res.setHeader(
      "Set-Cookie",
      Array.isArray(ctx.res.getHeader("Set-Cookie"))
        ? [
            ...(ctx.res.getHeader("Set-Cookie") as string[]),
            `${name}=${encodeURIComponent(value)}; ${opts}`,
          ]
        : [`${name}=${encodeURIComponent(value)}; ${opts}`]
    );
  };

  ctx.download = (filePath, filename) => {
    const stat = statSync(filePath);
    const name = filename || basename(filePath);
    ctx.res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    ctx.res.setHeader("Content-Length", stat.size);
    const ext = extname(filePath).slice(1);
    ctx.res.setHeader(
      "Content-Type",
      {
        js: "application/javascript",
        json: "application/json",
        txt: "text/plain",
        html: "text/html",
        pdf: "application/pdf",
      }[ext] || "application/octet-stream"
    );
    ctx.res.statusCode = ctx.res.statusCode || 200;
    ctx.res.end(readFileSync(filePath));
  };

  ctx.render = (templateStr: string, data: Record<string, any> = {}) => {
    const html = render(templateStr, data);
    ctx.html(html);
  };

  ctx.renderFile = (filePath: string, data: Record<string, any> = {}) => {
    const html = renderFile(filePath, data);
    ctx.html(html);
  };

  await next();
};
