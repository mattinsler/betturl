import * as betturl from '../src/betturl';

const EMPTY: betturl.ParsedUrlParsedQuery = {
  auth: undefined,
  hash: undefined,
  host: undefined,
  hosts: [],
  path: '/',
  port: undefined,
  query: {},
  scheme: undefined,
  url: ''
};

describe('parse', () => {
  it('should parse standard URLs', () => {
    const url = 'http://www.facebook.com';
    const parsed = betturl.parse(url);

    expect(parsed).toEqual({
      ...EMPTY,
      host: 'www.facebook.com',
      hosts: [
        {
          host: 'www.facebook.com',
          port: 80
        }
      ],
      path: '/',
      port: 80,
      scheme: 'http',
      url
    });
  });

  it('should parse partial URLs', () => {
    const url = '/foo/bar/baz?a=b';
    const parsed = betturl.parse(url);

    expect(parsed).toEqual({
      ...EMPTY,
      path: '/foo/bar/baz',
      query: {
        a: 'b'
      },
      url
    });
  });

  it('should parse querystrings after a /', () => {
    const url = '/?foo=bar';
    const parsed = betturl.parse(url);

    expect(parsed).toEqual({
      ...EMPTY,
      path: '/',
      query: {
        foo: 'bar'
      },
      url
    });
  });

  it('should parse partial URLs with a host', () => {
    const url = 'google.com/foo/bar/baz?a=b';
    const parsed = betturl.parse(url);

    expect(parsed).toEqual({
      ...EMPTY,
      host: 'google.com',
      hosts: [{ host: 'google.com', port: undefined }],
      path: '/foo/bar/baz',
      query: {
        a: 'b'
      },
      url
    });
  });

  it('should parse URLs with a user/password', () => {
    const url = 'https://user:password@www.facebook.com';
    const parsed = betturl.parse(url);

    expect(parsed).toEqual({
      ...EMPTY,
      auth: {
        user: 'user',
        password: 'password'
      },
      host: 'www.facebook.com',
      hosts: [{ host: 'www.facebook.com', port: 443 }],
      scheme: 'https',
      path: '/',
      port: 443,
      url
    });
  });

  it('should parse a complex connection string', () => {
    const url =
      'mongodb://hello@world.com:world@1.2.3.4:6000,2.3.4.5:8000/this/is/my/path?auto_reconnect=true&timeout=3000&prefix=test:&hello#foo-bar';
    const parsed = betturl.parse(url);

    expect(parsed).toEqual({
      auth: {
        user: 'hello@world.com',
        password: 'world'
      },
      hash: 'foo-bar',
      host: '1.2.3.4',
      hosts: [{ host: '1.2.3.4', port: 6000 }, { host: '2.3.4.5', port: 8000 }],
      path: '/this/is/my/path',
      port: 6000,
      query: {
        auto_reconnect: true,
        hello: true,
        prefix: 'test:',
        timeout: 3000
      },
      scheme: 'mongodb',
      url
    });
  });

  it('should not parse query when parse_query is false', () => {
    const url = 'http://foo.com/bar?yay=true';
    const parsed = betturl.parse(url, { parseQuery: false });

    expect(parsed).toEqual({
      ...EMPTY,
      host: 'foo.com',
      hosts: [{ host: 'foo.com', port: 80 }],
      path: '/bar',
      port: 80,
      scheme: 'http',
      query: 'yay=true',
      url
    });
  });

  it('should parse empty usernames', () => {
    const url = 'http://:password@foo.com';
    const parsed = betturl.parse(url);

    expect(parsed).toEqual({
      ...EMPTY,
      auth: {
        user: '',
        password: 'password'
      },
      host: 'foo.com',
      hosts: [{ host: 'foo.com', port: 80 }],
      path: '/',
      port: 80,
      scheme: 'http',
      url
    });
  });
});

describe('format', () => {
  it('should format a complex connection string', () => {
    const url = betturl.format({
      auth: {
        user: 'hello@world.com',
        password: 'world'
      },
      hash: 'foo-bar',
      hosts: [{ host: '1.2.3.4', port: 6000 }, { host: '2.3.4.5', port: 8000 }],
      path: '/this/is/my/path',
      query: {
        auto_reconnect: true,
        hello: true,
        prefix: 'test:',
        timeout: 3000
      },
      scheme: 'mongodb'
    });

    expect(url).toEqual(
      'mongodb://hello%40world.com:world@1.2.3.4:6000,2.3.4.5:8000/this/is/my/path?auto_reconnect=true&hello=true&prefix=test%3A&timeout=3000#foo-bar'
    );
  });

  it('should format an empty object as localhost', () => {
    const url = betturl.format({});

    expect(url).toEqual('localhost');
  });
});
