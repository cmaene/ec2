#!/usr/bin/env python
import web, os

urls = (
  '/', 'index'
)

app = web.application(urls, globals(), autoreload=False)
application = app.wsgifunc()
template_dir = os.path.abspath(os.path.dirname(__file__)) + "/templates"
render = web.template.render(template_dir)

class index:
    def GET(self):
        web.header('Content-Type','text/html; charset=utf-8', unique=True)
        return render.index("Web.py, Geoserver, PostgreSQL/PostGIS example", "41.787","-87.595")

    def POST(self):
        web.header('Content-Type','text/html')
        input = web.input()
        return "<p>Current location <b>"+input['lat']+"</b> & <b>"+input['lon']+"</b> .</p>"

if __name__ == "__main__":
    app.run()
