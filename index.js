const http = require('http');
const fs = require('fs');
const express = require('express');

const app = express();
app.use(express.static('public'));

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

app.listen(3000, function ()
{
    console.log('connection');
});
/*
app.all('*', (req, res) =>
{
 if(req.headers['referer'])
 {
 console.log(req.headers['referer']);
 let path = req.headers['referer'].toString();
 if (path.match('/.html'))
 {
 res.contentType('text/html');
 }
 if (path.match('/api/'))
 {
 res.contentType('application/json');
 }
 if (path.match('/.js'))
 {
 res.contentType('text/javascript');
 }
 if (path.match('/.css'))
 {
 res.contentType('text/css');
 }
    }
});
 */

app.get('/|/index|/index.html', (req, res) =>
{
    res.contentType('text/html');
    fs.readFile('public/index.html', (err, data) =>
    {
        res.send(data);
    });
});

const handlers =
    {};

let ALL_ARTICLES = fs.readFileSync('articles.json', 'utf-8');

app.post('/api/article/readall', (req, res) =>
{
    res.contentType('text/javascript');
    parseBodyJson(req, (err, payload) =>
    {
        res.contentType('application/json');
        payload.sortField = !payload.sortField ? 'date' : payload.sortField;
        payload.sortOrder = !payload.sortOrder ? 'desk' : payload.sortOrder;

        const articles = JSON.parse(ALL_ARTICLES);
        articles.sort((a, b) =>
                      {
                          let mul = 1;
                          payload.sortOrder === 'asc' ? mul = -1 : mul = 1;

                          if (a[payload.sortField] < b[payload.sortField])
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
        for (let i = (payload.limit) * (payload.page - 1); i < articles.length && i < payload.limit * payload.page; i++)
        {
            articles[i].comments = !payload.includeDeps ? undefined : articles[i].comments;
            answer.push(articles[i]);
        }

        a = {
            items: answer, meta: {
                page: payload.page,
                pages: Math.trunc((articles.length / payload.limit + 1)),
                count: Math.trunc(articles.length),
                limit: Math.trunc(payload.limit)
            }
        };
        res.send(a);
    });
});

app.post('/api/article/read', (req, res) =>
{
    parseBodyJson(req, (err, payload) =>
    {
        const articles = JSON.parse(ALL_ARTICLES);
        console.log(articles);
        res.send(articles[payload.id]);
    });
});

app.post('/api/article/create', (req, res) =>
{
    parseBodyJson(req, (err, payload) =>
    {
        const articles = JSON.parse(ALL_ARTICLES);
        const art = new Article(!articles.length ? 0 : articles[articles.length > 0 ? articles.length - 1 : 0].id + 1,
                                payload.title,
                                payload.text,
                                payload.author, []);
        articles.push(art);

        ALL_ARTICLES = JSON.stringify(articles);
        fs.writeFile('articles.json', ALL_ARTICLES, () => {});
        res.send(JSON.stringify(art));
    });
});

app.post('/api/article/update', (req, res) =>
{
    parseBodyJson(req, (err, payload) =>
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
        res.send("OK");
    });
});

app.post('/api/article/delete', (req, res) =>
{
    parseBodyJson(req, (err, payload) =>
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
        ALL_ARTICLES = JSON.stringify(newArticles);
        fs.writeFile('articles.json', ALL_ARTICLES, () => {});
        res.send("DELETE");
    });
});

app.post('/api/comments/create', (req, res) =>
{
    parseBodyJson(req, (err, payload) =>
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
        res.send("OK");
    });
});

app.post('/api/comments/delete', (req, res) =>
{
    parseBodyJson(req, (err, payload) =>
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
        res.send("OK");
    });
});

function notFound(req, res, payload, cb)
{
    cb({code: 404, message: 'Not found'});
}


function getLogs(req, res, payload, cb)
{
    fs.readFile('logs.log', (err, data) =>
    {
        //cb({ null,  data.toString()});
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
    fs.readFile('public/index.js', (err, data) =>
    {
        res.end(data);
    });
}

function getForm(req, res, payload, cb)
{
    fs.readFile('public/form.html', (err, data) =>
    {
        res.end(data);
    });
}

function getCss(req, res, payload, cb)
{
    fs.readFile('public/site.css', (err, data) =>
    {
        res.end(data);
    });
}

function getJsForm(req, res, payload, cb)
{
    fs.readFile('public/form.js', (err, data) =>
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