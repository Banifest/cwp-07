function writeArticles(sortField,
                       sortOrder,
                       page,
                       limit,
                       includeDeps)
{
    $.post("/api/article/readall", JSON.stringify({
                                                      "sortField": sortField,
                                                      "sortOrder": sortOrder,
                                                      "page": page,
                                                      "limit": limit,
                                                      "includeDeps": includeDeps
                                                  }), (err, msg, data) =>
           {
               console.log(sortField,
                           sortOrder,
                           page,
                           limit,
                           includeDeps);
               data = data.responseJSON;

               msgMeta = data.meta;
               msgItems = data.items;

               const clearBoby = document.body.innerHTML;

               for (let i = 0; i < msgItems.length; i++)
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

function getAllArticle()
{
    $.post("/api/article/readall", JSON.stringify({
                                                      "sortField": "",
                                                      "sortOrder": "",
                                                      "page": "",
                                                      "limit": "",
                                                      "includeDeps": ""
                                                  }), (err, msg, data) =>
           {
               console.log(data.responseJSON.meta.pages.toString());
               return `<br><input type="number" name="pages" value="1" min="1" max="${data.responseJSON.meta.pages}"><br>`;
           });
}
