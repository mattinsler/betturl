export interface Host {
  host?: string;
  port?: number;
}

export interface BaseParsedUrl {
  auth?: {
    user: string;
    password: string;
  };
  hash?: string;
  host?: string;
  hosts: Host[];
  path: string;
  port?: number;
  scheme?: string;
  url: string;
}

export interface ParsedUrlUnparsedQuery extends BaseParsedUrl {
  query?: string;
}

export type QueryValue = boolean | null | number | string | undefined;
export interface ParsedQuery {
  [key: string]: QueryValue;
}

export interface ParsedUrlParsedQuery extends BaseParsedUrl {
  query: ParsedQuery;
}

export type ParsedUrl = ParsedUrlParsedQuery | ParsedUrlUnparsedQuery;

export interface BaseFormatUrl {
  auth?: {
    user: string;
    password: string;
  };
  hash?: string;
  path?: string;
  query?: string | ParsedQuery;
  scheme?: string;
}

export interface FormatUrlWithHosts extends BaseFormatUrl {
  hosts: Host[];
}

export interface FormatUrlWithoutHosts extends BaseFormatUrl {
  host?: string;
  port?: number;
}

export type FormatUrl = FormatUrlWithHosts | FormatUrlWithoutHosts;

const KNOWN_PORTS: { [scheme: string]: number } = {
  http: 80,
  https: 443
};

function parseAuth(auth: string) {
  const [user, password] = auth.split(':');
  return {
    user: decodeURIComponent(user),
    password: decodeURIComponent(password)
  };
}

function parseHost(host: string, protocol: string) {
  const [h, p] = host.split(':');
  return {
    host: decodeURIComponent(h),
    port: p ? parseInt(p, 10) : KNOWN_PORTS[protocol]
  };
}

function parseQueryValue(value: string): QueryValue {
  // number
  if (parseInt(value, 10).toString() === value) {
    return parseInt(value, 10);
  }
  if (parseFloat(value).toString() === value) {
    return parseFloat(value);
  }
  const lowerValue = value.toLowerCase();
  // boolean
  if (lowerValue === 'true') {
    return true;
  }
  if (lowerValue === 'false') {
    return false;
  }
  // null
  if (lowerValue === 'null') {
    return null;
  }
  // undefined
  if (lowerValue === 'undefined') {
    return undefined;
  }
  // else: string
  return value;
}

function formatQueryValue(value: QueryValue): string {
  if (value === null) {
    return 'null';
  }

  switch (typeof value) {
    case 'undefined':
      return 'undefined';
    case 'number':
      return (value as number).toString();
    case 'boolean':
      return value ? 'true' : 'false';
  }

  return value as string;
}

function parseQuery(query: string): { [key: string]: QueryValue } {
  const q: { [key: string]: QueryValue } = {};
  for (let kv of query.split('&')) {
    const match = /^([^=]+)(=(.*))?$/.exec(kv);
    if (match) {
      q[decodeURIComponent(match[1])] = match[3]
        ? parseQueryValue(decodeURIComponent(match[3]))
        : true;
    }
  }
  return q;
}

function parseUrl(url: string) {
  const urlMatch = /^(([^:]*):\/\/)?(([^:]*:[^@]*)@)?([^\/]+)?(\/.*)?$/.exec(
    url
  );
  if (!urlMatch) {
    throw new Error();
  }
  const pathMatch = /(\/[^?#]*)?(\?([^#]+))?(#(.*))?/.exec(urlMatch[6]);
  if (!pathMatch) {
    throw new Error();
  }

  return {
    scheme: urlMatch[2],
    auth: urlMatch[4],
    host: urlMatch[5],
    path: decodeURIComponent(pathMatch[1] || '/'),
    query: decodeURIComponent(pathMatch[3] || ''),
    hash: decodeURIComponent(pathMatch[5] || '')
  };
}

export function parse(url: string): ParsedUrlParsedQuery;
export function parse(
  url: string,
  opts: { parseQuery: true }
): ParsedUrlParsedQuery;
export function parse(
  url: string,
  opts: { parseQuery: false }
): ParsedUrlUnparsedQuery;
export function parse(
  url: string,
  opts: { parseQuery: boolean } = { parseQuery: true }
): ParsedUrl {
  const p = parseUrl(url);
  const hosts: Host[] = p.host
    ? p.host.split(',').map(h => parseHost(h, p.scheme))
    : [];
  const auth = p.auth ? parseAuth(p.auth) : undefined;
  const [host, port] = ((): [string?, number?] => {
    if (hosts.length === 0) {
      return [undefined, undefined];
    }
    return [hosts[0].host, hosts[0].port];
  })();

  const parsedUrl: BaseParsedUrl = {
    auth,
    hash: p.hash || undefined,
    host,
    hosts,
    path: p.path,
    port,
    scheme: p.scheme || undefined,
    url
  };

  if (opts.parseQuery === true) {
    return {
      ...parsedUrl,
      query: parseQuery(p.query)
    };
  }

  return {
    ...parsedUrl,
    query: p.query || undefined
  };
}

export function format(opts: FormatUrl): string {
  const hosts: Host[] = (opts as FormatUrlWithHosts).hosts
    ? (opts as FormatUrlWithHosts).hosts
    : [
        {
          host: (opts as FormatUrlWithoutHosts).host,
          port: (opts as FormatUrlWithoutHosts).port
        }
      ];

  const host = hosts
    .map(({ host, port }) => {
      const h = host || 'localhost';
      let p: string | number | undefined =
        port ||
        (opts.scheme && KNOWN_PORTS[opts.scheme]
          ? KNOWN_PORTS[opts.scheme]
          : undefined);

      if (!p || KNOWN_PORTS[opts.scheme || ''] === p) {
        p = '';
      } else {
        p = `:${p}`;
      }

      return h + p;
    })
    .join(',');

  const auth = opts.auth
    ? `${encodeURIComponent(opts.auth.user)}:${encodeURIComponent(
        opts.auth.password
      )}@`
    : '';

  const path = opts.path ? `/${opts.path.replace(/^\/+/, '')}` : '';
  let query = !opts.query
    ? ''
    : typeof opts.query === 'string'
      ? opts.query
      : Object.entries(opts.query)
          .map(
            ([k, v]) =>
              `${encodeURIComponent(k)}=${encodeURIComponent(
                formatQueryValue(v)
              )}`
          )
          .join('&');
  if (query) {
    query = `?${query}`;
  }
  const hash = opts.hash ? `#${opts.hash}` : '';
  const scheme = opts.scheme ? `${opts.scheme}://` : '';

  return [scheme, auth, host, path, query, hash].join('');
}
