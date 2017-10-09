const http = require('http');
const fs = require('fs');
//const express = require('express');

const hostname = '127.0.0.1';
const port = 3000;


class Article
{
    constructor(id, title = "", text = "", author = "", comments = [])
    {
        this.id = id;
        this.title = title;
        this.text = text;
        this.date = (new Date).getTime();
        this.author = author;
        this.comments = comments;
    }
}

class Comment
{
    constructor(id, articleId, text = "", author = "")
    {
        this.id = id;
        this.articleId = articleId;
        this.text = text;
        this.date = (new Date).getTime();
        this.author = author;
    }
}

const handlers =
    {
        '': getIndex,
        '/': getIndex,
        '/index.html': getIndex,
        '/form.html': getForm,
        '/form.js': getJsForm,
        '/app.js': getJS,
        '/site.css': getCss,
        '/sum': sum,
        '/api/article/readall': articleReadAll,
        '/api/article/read': articleRead,
        '/api/article/create': articleCreate,
        '/api/article/update': articleUpdate,
        '/api/article/delete': articleDelete,
        '/api/comments/create': commentsCreate,
        '/api/comments/delete': commentsDelete,
        '/api/logs': getLogs
    };


let ALL_ARTICLES = fs.readFileSync('articles.json', 'utf-8');

const server = http.createServer((req, res) =>
                                 {
                                     const contentType = getContentType(req.url);
                                     if (contentType === "application/json")
                                     {
                                         parseBodyJson(req, (err, payload) =>
                                         {
                                             const handler = getHandler(req.url);

                                             handler(req, res, payload, (err, result) =>
                                             {
                                                 if (err)
                                                 {
                                                     res.statusCode = err.code;
                                                     res.setHeader('Content-Type', 'application/json');
                                                     res.end(JSON.stringify(err));

                                                     return;
                                                 }

                                                 res.statusCode = 200;


                                                 res.setHeader('Content-Type', 'application/json');
                                                 res.end(JSON.stringify(result));
                                             });
                                         });
                                     }
                                     else
                                     {
                                         const handler = getHandler(req.url);

                                         handler(req, res, (err, result) =>
                                         {
                                             if (err)
                                             {
                                                 res.statusCode = err.code;
                                                 res.setHeader('Content-Type', 'application/json');
                                                 res.end(JSON.stringify(err));

                                                 return;
                                             }

                                             res.statusCode = 200;


                                             res.setHeader('Content-Type', contentType);
                                             res.end(JSON.stringify(result));
                                         });
                                     }

                                 });

server.listen(port, hostname, () =>
{
    console.log(`Server running at http://${hostname}:${port}/`);
});

function getContentType(url)
{
    if (url === '/' || url === '')
    {
        return 'text/html';
    }
    if (url.match(/.html/))
    {
        return 'text/html';
    }
    if (url.match(/.css/))
    {
        return 'text/css';
    }
    if (url.match(/.js/))
    {
        return 'text/javascript';
    }
    if (url.match(/api/))
    {
        return 'application/json';
    }
    return 'text/html';
}

function getHandler(url)
{
    return handlers[url] || notFound;
}

function sum(req, res, payload, cb)
{
    const result = {c: payload.a + payload.b};
    cb(null, result);
}

function articleReadAll(req, res, payload, cb)
{
    payload.sortField = !payload.sortField ? 'date' : payload.sortField;
    payload.sortOrder = !payload.sortOrder ? 'desk' : payload.sortOrder;

    const articles = JSON.parse(ALL_ARTICLES);
    articles.sort((a, b) =>
                  {
                      let mul = 1;
                      payload.sortOrder === 'asc' ? mul = -1 : mul = 1;

                      if (a[payload.sortField] > b[payload.sortField])
                      {
                          return mul;
                      }
                      else
                      {
                          return -mul;
                      }
                  });

    payload.page = !payload.page ? 1 : payload.page;
    payload.limit = !payload.limit ? 10 : payload.limit;
    payload.includeDeps = !payload.includeDeps ? false : payload.includeDeps;

    const answer = [];
    for (let i = (payload.limit - 1) * payload.page - 1; i < articles.length && i < payload.limit * payload.page; i++)
    {
        articles[i].comments = !payload.includeDeps ? undefined : articles[i].comments;
        answer.push(articles[i]);
    }

    a = {items: answer,
        meta: {
            page: payload.page,
            pages: (articles.length / payload.limit + 1),
            count: articles.length,
            limit: payload.limit
        }
    };
    cb({code: 200, message: a});
}

function articleRead(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);
    console.log(articles);
    cb(null, articles[payload.id]);
}

function articleCreate(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);
    const art = new Article(articles[articles.length > 0 ? articles.length - 1 : 0].id + 1,
        payload.title,
        payload.text,
        payload.author, []);
    articles.push(art);

    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, () => {});
    cb(null, JSON.stringify(art));
}

function articleUpdate(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);
    for (let iter of articles)
    {
        if (iter.id === payload.id)
        {
            iter.title = payload.title;
            iter.text = payload.text;
            iter.author = payload.author;
        }
    }
    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, () => {});
    cb(null, "OK");
}

function articleDelete(req, res, payload, cb)
{

    const articles = JSON.parse(ALL_ARTICLES);
    const newArticles = [];
    for (let iter of articles)
    {
        if (iter.id !== payload.id)
        {
            newArticles.push(iter);
        }
    }
    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, () => {});
    cb(null, "OK");
}

function commentsCreate(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);

    for (let iter of articles)
    {
        if (iter.id === payload.articleId)
        {
            iter.comments.push(
                new Comment(iter.comments[iter.comments.length > 0 ? iter.comments.length - 1 : 0] + 1,
                    payload.articleId,
                    payload.text,
                    payload.author));
        }
    }

    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, () => {});
    cb(null, "OK");
}

function commentsDelete(req, res, payload, cb)
{
    const articles = JSON.parse(ALL_ARTICLES);

    for (let iter of articles)
    {
        if (iter.id === payload.articleId)
        {
            let newComments = [];
            for (subIter of iter.comments)
            {
                if (subIter.id !== payload.id)
                {
                    newComments.push(subIter);
                }
            }
            iter.comments = newComments;
        }
    }

    ALL_ARTICLES = JSON.stringify(articles);
    fs.writeFile('articles.json', ALL_ARTICLES, () => {});
    cb(null, "OK");
}

//catch (err)
//{
//    cb({ code: 400, message: 'Request Invalid'});
//}

function notFound(req, res, payload, cb)
{
    res.end("Not Found");
}


function getLogs(req, res, payload, cb)
{
    fs.readFile('logs.json', (err, data) =>
    {
        cb(null, data.toString());
    });
}

function getIndex(req, res, payload, cb)
{
    fs.readFile('public/index.html', (err, data) =>
    {
        res.end(data);
    });
}

function getJS(req, res, payload, cb)
{
    fs.readFile('index.js', (err, data) =>
    {
        res.end(data);
    });
}

function getForm(req, res, payload, cb)
{
    fs.readFile('form.html', (err, data) =>
    {
        res.end(data);
    });
}

function getCss(req, res, payload, cb)
{
    fs.readFile('site.css', (err, data) =>
    {
        res.end(data);
    });
}

function getJsForm(req, res, payload, cb)
{
    fs.readFile('form.js', (err, data) =>
    {
        res.end(data);
    });
}

function wrongId(req, res, payload, cb)
{
    cb({code: 888, message: 'Wrong id'});
}


function parseBodyJson(req, cb)
{
    let body = [];

    req.on('data', function (chunk)
    {
        body.push(chunk);
    }).on('end', function ()
    {

        body = Buffer.concat(body).toString();
        console.log(body);
        let params = JSON.parse(body);
        cb(null, params);
    });
}