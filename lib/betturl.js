(function() {
  var STANDARD_PORT, parse_host, parse_query, type_parse;

  STANDARD_PORT = {
    http: 80,
    https: 443
  };

  type_parse = function(value) {
    if (parseInt(value).toString() === value) {
      return parseInt(value);
    }
    if (parseFloat(value).toString() === value) {
      return parseFloat(value);
    }
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
    if (value.toLowerCase() === 'null') {
      return null;
    }
    if (value.toLowerCase() === 'undefined') {
      return void 0;
    }
    return value;
  };

  parse_host = function(host, protocol) {
    var h, p, _ref;
    _ref = host.split(':'), h = _ref[0], p = _ref[1];
    p = p != null ? parseInt(p) : STANDARD_PORT[protocol];
    return {
      host: decodeURIComponent(h),
      port: p
    };
  };

  parse_query = function(query) {
    var k, kv, q, v, _i, _len, _ref, _ref1;
    q = {};
    _ref = query.split('&');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      kv = _ref[_i];
      _ref1 = kv.split('='), k = _ref1[0], v = _ref1[1];
      q[decodeURIComponent(k)] = v != null ? type_parse(decodeURIComponent(v)) : true;
    }
    return q;
  };

  exports.parse = function(url, opts) {
    var auth, hash, host, hosts, o, password, path, protocol, query, user, _ref, _ref1, _ref2, _x;
    if (opts == null) {
      opts = {};
    }
    _ref = /([^:]+):\/\/(([^:]+:[^@]+)@)?([^\/]+)(.*)/.exec(url), _x = _ref[0], protocol = _ref[1], _x = _ref[2], auth = _ref[3], host = _ref[4], path = _ref[5];
    _ref1 = /(\/[^?#]+)?(\?([^#]+))?(#(.*))?/.exec(path), _x = _ref1[0], path = _ref1[1], _x = _ref1[2], query = _ref1[3], _x = _ref1[4], hash = _ref1[5];
    hosts = host.split(',').map(function(h) {
      return parse_host(h, protocol);
    });
    if (auth != null) {
      _ref2 = auth.split(':'), user = _ref2[0], password = _ref2[1];
    }
    if (opts.parse_query === false) {
      query = query != null ? decodeURIComponent(query) : '';
    } else {
      query = query != null ? parse_query(query) : {};
    }
    if (path == null) {
      path = '/';
    }
    o = {
      url: url,
      protocol: protocol,
      hosts: hosts,
      path: decodeURIComponent(path),
      query: query,
      hash: hash || ''
    };
    if (hosts.length === 1) {
      o.host = hosts[0].host;
      o.port = hosts[0].port;
    }
    if ((user != null) || (password != null)) {
      o.auth = {
        user: decodeURIComponent(user),
        password: decodeURIComponent(password)
      };
    }
    return o;
  };

}).call(this);
