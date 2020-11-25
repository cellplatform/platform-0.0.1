import { defaultValue, Schema, t, time, util } from '../common';

type B = t.RuntimeBundleOrigin;

export async function execFunc(args: {
  host: string;
  db: t.IDb;
  runtime: t.RuntimeEnv;
  body: t.IReqPostFuncBody;
}) {
  try {
    const timer = time.timer();
    const { body, runtime } = args;
    const silent = defaultValue(body.silent, true);

    const host = body.host || args.host;
    const uri = body.uri;
    const dir = body.dir;
    const pull = body.pull;
    const bundle: B = { host, uri, dir };
    const urls = Schema.urls(host);

    const exists = await runtime.exists(bundle);
    const res = await runtime.run(bundle, { silent, pull });
    const { manifest, errors } = res;

    const status = res.ok ? 200 : 500;
    const data: t.IResPostFunc = {
      elapsed: timer.elapsed.msec,
      cache: { exists, pulled: pull ? true : !exists },
      runtime: { name: runtime.name },
      size: {
        bytes: defaultValue(manifest?.bytes, -1),
        files: defaultValue(manifest?.files.length, -1),
      },
      urls: {
        files: urls.runtime.bundle.files(bundle).toString(),
        manifest: urls.runtime.bundle.manifest(bundle).toString(),
      },
      errors,
    };

    // Finish up.
    return { status, data };
  } catch (err) {
    return util.toErrorPayload(err);
  }
}
