import os
import io
import shutil

def concat():
    with io.open("BulletHell.js", "w") as file:
        with io.open("src/plugin.js", "r") as f:
            file.write(f.read())
            file.write("\r\n\r\n")
        with io.open("src/sprite.js", "r") as f:
            file.write(f.read())
            file.write("\r\n\r\n")
        for f in os.listdir("src"):
            if f != "plugin.js" and f != "sprite.js" and f.endswith(".js"):
                with io.open("src/{}".format(f), "r") as f:
                    file.write(f.read())
                    file.write("\r\n\r\n")

def docs():
    os.system("jsdoc -c jsdoc-conf.json")

def demo():
    shutil.copyfile("BulletHell.js", "demo/js/plugins/BulletHell.js")
    shutil.make_archive("release", "zip", "demo")

concat()
docs()
demo()