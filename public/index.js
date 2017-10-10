function writeArticles()
{
    $.post("/api/article/readall", JSON.stringify({
                                                      "sortField": "author",
                                                      "sortOrder": "desk",
                                                      "page": "1",
                                                      "limit": "2",
                                                      "includeDeps": true
                                                  }), (err, msg, data) =>
           {
               data = data.responseJSON;

               msgMeta = data.meta;
               msgItems = data.items;

               const clearBoby = document.body.innerHTML;

               for (let i = (msgMeta.page - 1) * msgMeta.limit; i < msgMeta.limit * msgMeta.page; i++)
               {
                   document.body.innerHTML += "<div class=\"article\">"
                       + `<h1><center>${msgItems[i].title}</center></h1><br>`
                       + `${msgItems[i].text}<br>`
                       + `<h4 align="left">Дата изменения: ${(new Date(msgItems[i].date)).toDateString()}</h4><br>`
                       + `<h4 align="right">Автор: ${msgItems[i].author}</h4>`
                       + "</div>";
               }
               //document.body.innerHTML = clearBoby;
           });
}