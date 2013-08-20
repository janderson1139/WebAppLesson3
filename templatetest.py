from jinja2 import Environment, PackageLoader
env = Environment(loader=PackageLoader('yourapplication', 'HTML'))
template = env.get_template('index.html')
print template.render(the='variables', go='here')
