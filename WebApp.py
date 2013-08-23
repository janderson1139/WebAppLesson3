import webapp2
import cgi
import string
from string import maketrans
import re
from google.appengine.api import urlfetch
import jinja2
import os
import hashlib

from google.appengine.ext import db

USER_RE = re.compile(r"^[a-zA-Z0-9_-]{3,20}$")
def valid_username(username):
    return USER_RE.match(username)

PASSWORD_RE = re.compile(r"^.{3,20}$")
def valid_password(password):
    return PASSWORD_RE.match(password)

EMAIL_RE = re.compile(r"^[\S]+@[\S]+\.[\S]+$")
def valid_email(email):
    return EMAIL_RE.match(email)

def escape_html(s):
    return cgi.escape(s, quote = True)

jinja_environment = jinja2.Environment(autoescape=True,
    loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'HTML')))
class BlogHandler(webapp2.RequestHandler):
    def write(self, *a, **kw):
        self.response.out.write(*a, **kw)
    
    def render_str(self, template, **params):
        t = jinja_environment.get_template(template)
        return t.render(params)
    
    def render(self, template, **kw):
        self.write(self.render_str(template, **kw))

class Post(db.Model):
    subject = db.StringProperty(required = True)
    content = db.TextProperty(required = True)
    created = db.DateTimeProperty(auto_now_add = True)
    postid = db.IntegerProperty(required = True)
class User(db.Model):
    username = db.StringProperty(required = True)
    passwordhash = db.StringProperty(required = True)
    email = db.StringProperty(required = False)
    
class PermaLink(webapp2.RequestHandler):
    def get(self):
        postnum = self.request.path
        postnum = postnum.replace('/','')
        self.response.out.write(postnum)
        #posts = db.Query(Post).filter("postid =", postnum).fetch(limit=1)
        query = "select * from Post WHERE postid = %s" % postnum
        posts = db.GqlQuery(query)
        
        template_values = {}
        template_values['posts'] = posts
        template = jinja_environment.get_template('permalink.html')
        self.response.out.write(template.render(template_values))
        
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
            posts = db.GqlQuery("select * from Post ORDER BY postid")
            numposts = 999
            for post in posts:
                numposts = post.postid
            numposts = numposts + 1
            #if len(posts) >= 1:
            #    numposts = posts[0].postid
            #else:
            #    numposts = 1000
            newpost = Post(subject = subject, content = content, postid = numposts)
            newpost.put()
            url = "/%s" % numposts
            self.redirect(url)
            
        else:
            error = "we need both a subject and some content please"
            self.write_form(subject=subject, content = content, error = error)
class SignUp(BlogHandler):
    def get(self):
        self.render('signup.html')
    def post(self):
        username = self.request.get('username')
        password1 = self.request.get('password') 
        password2 = self.request.get('verify') 
        email = self.request.get('email')
         
        if password1 == password2 and PASSWORD_RE.match(password1) and USER_RE.match(username):
            passwordhash = hashlib.sha256(password1).hexdigest()
            newuser = User(username=username, passwordhash=passwordhash, email=email)
            newuser.put()
            userid = newuser.key().id()
            
            
            cookiestr = str('user_id=%s|%s; Path=/' % (userid, passwordhash))
            self.response.headers.add_header('Set-Cookie',cookiestr)
            
        else:
            error = "Invalid input"
            self.render('signup.html',username=username, email=email, error=error)
        self.redirect('/welcome')
class Welcome(BlogHandler):
    def get(self):
        usercookie = self.request.cookies.get('user_id')
        if usercookie:
            userid = usercookie.split('|')[0]
            hash = usercookie.split('|')[1]
            #query = "select * from User WHERE id = %s" % userid
            #users = db.GqlQuery(query)
            key = db.Key.from_path('User', int(userid))
            user = db.get(key)
            if user:
                self.render('welcome.html', username=user.username)
            else:
                self.redirect('/signup')    
        else:
            self.redirect('/signup')
class LoginPage(BlogHandler):\
    
    def get(self):
        self.render('login.html')
    def post(self):
        username = self.request.get('username')
        password = self.request.get('password') 
        passwordhash = hashlib.sha256(password).hexdigest()

        #quser = User.all()
        #quser.filter('username =', username)
        #quser.filter('passwordhash =', passwordhash)
        user = db.GqlQuery("SELECT * FROM User WHERE username=:1", username)
        user = user.get()
        
        if user AND user.passwordhash == passwordhash:
            cookiestr = str('user_id=%s|%s; Path=/' % (user.id_or_name, passwordhash))
            self.response.headers.add_header('Set-Cookie',cookiestr)   
            self.redirect('/welcome')
        else:
            error = "Invalid Login"
            self.render('login.html',username = username, error = error)
            
        
        
            
application = webapp2.WSGIApplication([('/', MainPage),('/newpost', NewPost),('/\d{4}', PermaLink), ('/signup', SignUp), ('/welcome', Welcome), ('/login', LoginPage) ],
                             debug=True)
