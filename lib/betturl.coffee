STANDARD_PORT = {
  http: 80
  https: 443
}

type_parse = (value) ->
  return parseInt(value) if parseInt(value).toString() is value
  return parseFloat(value) if parseFloat(value).toString() is value
  return true if value.toLowerCase() is 'true'
  return false if value.toLowerCase() is 'false'
  return null if value.toLowerCase() is 'null'
  return undefined if value.toLowerCase() is 'undefined'
  value

parse_host = (host, protocol) ->
  [h, p] = host.split(':')
  p = if p? then parseInt(p) else STANDARD_PORT[protocol]
  {host: decodeURIComponent(h), port: p}

parse_query = (query) ->
  q = {}
  for kv in query.split('&')
    [k, v] = kv.split('=')
    q[decodeURIComponent(k)] = if v? then type_parse(decodeURIComponent(v)) else true
  q

exports.parse = (url, opts = {}) ->
  [_x, protocol, _x, auth, host, path] = /([^:]+):\/\/(([^:]+:[^@]+)@)?([^\/]+)(.*)/.exec(url)
  [_x, path, _x, query, _x, hash] = /(\/[^?#]+)?(\?([^#]+))?(#(.*))?/.exec(path)
  
  hosts = host.split(',').map (h) -> parse_host(h, protocol)
  [user, password] = auth.split(':') if auth?
  
  if opts.parse_query is false
    query = if query? then decodeURIComponent(query) else ''
  else
    query = if query? then parse_query(query) else {}
  
  path ?= '/'
  
  o = {
    url: url
    protocol: protocol
    hosts: hosts
    path: decodeURIComponent(path)
    query: query
    hash: hash or ''
  }
  
  if hosts.length is 1
    o.host = hosts[0].host
    o.port = hosts[0].port
  o.auth = {user: decodeURIComponent(user), password: decodeURIComponent(password)} if user? or password?
  
  o

# exports.format = () ->
#   
#   
#   
#   exports.make_url = (base, path) ->
#     url = require 'url'
#     base_url = url.parse(base)
#     path_url = url.parse(path)
# 
#     return path if path.protocol? and path.host?
#     return "#{base_url.protocol}//#{base_url.host}#{path_url.pathname}" if path[0] is '/'
#     /^(.+\/)/.exec(base_url.href) + path_url.pathname
#   
