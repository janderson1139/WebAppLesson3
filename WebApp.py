import webapp2
import cgi
import string
from string import maketrans
import re
from google.appengine.api import urlfetch
import jinja2
import os

from google.appengine.ext import db


def escape_html(s):
    return cgi.escape(s, quote = True)

jinja_environment = jinja2.Environment(autoescape=True,
    loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'HTML')))

class Post(db.Model):
    subject = db.StringProperty(required = True)
    content = db.TextProperty(required = True)
    created = db.DateTimeProperty(auto_now_add = True)
class PermaLink(webapp2.RequestHandler):
    def get(self):
        self.response.out.write(self.request.path)

class MainPage(webapp2.RequestHandler):
    def write_form(self):
        template_values = {}
        posts = db.GqlQuery("select * from Post ORDER BY created DESC")
        template_values['posts'] = posts
        template = jinja_environment.get_template('index.html')
        self.response.out.write(template.render(template_values))
    def get(self):
        self.write_form()
class NewPost(webapp2.RequestHandler):
    def write_form(self, subject = "", content = "", error=""):
        template_values = {}
        template_values['subject']=subject
        template_values['content']=content
        template_values['error']=error
        
        template = jinja_environment.get_template('newpost.html')
        self.response.out.write(template.render(template_values))
    def get(self):
        self.write_form()
    def post(self):
        subject = self.request.get("subject")
        content = self.request.get("content")

        if subject and content:
            newpost = Post(subject = subject, content = content)
            newpost.put()
            self.redirect("/")
        else:
            error = "we need both a subject and some content please"
            self.write_form(subject=subject, content = content, error = error)

application = webapp2.WSGIApplication([('/', MainPage),('/newpost', NewPost),('/\d{4}', PermaLink) ],
                             debug=True)
