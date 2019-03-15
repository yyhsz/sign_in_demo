var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}
let session = {}
var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('方方说：含查询字符串的路径\n' + pathWithQuery)

  if (path === '/sign_up' && method === 'GET') {
    let string = fs.readFileSync('./sign_up.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  }

  else if (path === '/sign_up' && method === 'POST') {
    readBody(request).then((body) => {
      let strings = body.split('&') // ['email=1', 'password=2', 'password_confirmation=3']
      let hash = {}
      strings.forEach((string) => {
        // string == 'email=1'
        let parts = string.split('=') // ['email', '1']
        let key = parts[0]
        let value = parts[1]
        hash[key] = decodeURIComponent(value) // hash['email'] = '1'
      })
      let { email, password, password_confirmation } = hash
      if (email.indexOf('@') === -1) {
        console.log(4)
        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.write(`{
          "errors": {
            "email": "invalid"
          }
        }`)
      } else if (password === password_confirmation) {

        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.write(`password not match`)
      } else {

        let users = fs.readFileSync('./db/users', 'utf8')
        try {
          users = JSON.parse(users)
          console.log('解析成功')
        } catch (exception) {
          users = []
          console.log('解析失败')
        }
        let emailInUse = 0
        for (let i in users) {
          if (users[i].email === email) {
            console.log(users[i].email); emailInUse = true; break;
          }
        }
        if (emailInUse) {

          response.statusCode = 400
          response.write('邮箱已存在')
        } else if (emailInUse) {

          users.push({ email: email, password: password })
          var userString = JSON.stringify(users)
          fs.writeFileSync('./db/users', userString)
          response.statusCode = 200
          response.write('success')
        }
      }
      response.end()
    })
  }
  else if (path === '/sign_in' && method === 'GET') {
    let string = fs.readFileSync('./sign_in.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  }
  //登陆 
  else if (path === '/sign_in' && method === 'POST') {
    readBody(request).then((body) => {

      let strings = body.split('&') // ['email=1', 'password=2', 'password_confirmation=3']
      let data = {}
      strings.forEach((string) => {
        // string == 'email=1'
        let parts = string.split('=') // ['email', '1']
        let key = parts[0]
        let value = parts[1]
        data[key] = decodeURIComponent(value) // data['email'] = '1'
      })
      let { email, password } = data
      let users = fs.readFileSync('./db/users', 'utf8')
      try {
        users = JSON.parse(users)
        console.log('解析成功')
      } catch (exception) {
        users = []
        console.log('解析失败')
      }
      let userExist = 0
      for (let key in users) {
        if (users[key].email === email && users[key].password === password) {
          userExist = true;
          break;
        }
      }
      if (userExist) {
        let sessionID = Math.random() * 100000
        session[sessionID] = { sign_in_email: email }
        response.statusCode = 200
        response.setHeader('set-Cookie', `sign_in_email=${sessionID}`)
        response.write('登陆成功')

      } else {
        response.statusCode = 401
        response.write('用户不存在')
      }
      response.end()
    })
  }
  else if (path === '/main.js') {
    let string = fs.readFileSync('./main.js', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/javascript;charset=utf-8')
    response.write(string)
    response.end()
  }else if(path ==='/default.css'){
    let string = fs.readFileSync('./default.css','utf8')
    response.statusCode = 200
    response.setHeader('Content-Type','text/css;charset=utf8')
    response.write(string)
    response.end()
  } else if (path === '/jquery-3.3.1.js') {
    let string = fs.readFileSync('./jquery-3.3.1.js', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/javascript;charset=utf-8')
    response.write(string)
    response.end()
  }
  else if (path === '/') {


    if (request.headers.cookie) {//如果cookie存在，就读取cookie
      let string = fs.readFileSync('./index.html', 'utf-8')
      response.statusCode = 200
      console.log(request.headers.cookie)
      let arr = request.headers.cookie.split(';')
      let email = []
      arr.forEach((value, key) => {
        email.push(session[arr[key].split('=')[1]].sign_in_email)
      })
      console.log(email)
      string = string.replace('__email__', email)
      response.write(string)
    } else { //如果没有cookie 就跳转回登陆界面
      let string = fs.readFileSync('./sign_in.html', 'utf8')
      response.statusCode = 200
      response.setHeader('Content-Type', 'text/html;charset=utf-8')
      response.write(string)
    }
    response.end()
  }

  else if (path === '/xxx') {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/json;charset=utf-8')
    response.setHeader('Access-Control-Allow-Origin', 'http://frank.com:8001')
    response.write(`
    {
      "note":{
        "to": "小谷",
        "from": "方方",
        "heading": "打招呼",
        "content": "hi"
      }
    }
    `)
    response.end()
  } else {
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(`
      {
        "error": "not found"
      }
    `)
    response.end()
  }
  /******** 代码结束，下面不要看 ************/
})

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = []
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      resolve(body)
    })
  })
}

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)


