.PHONY: demo
all: concat docs demo
concat:	src/*.js
	cat src/plugin.js > BulletHell.js
	printf "\r\n\r\n" >> BulletHell.js
	cat src/sprite.js >> BulletHell.js
	printf "\r\n\r\n" >> BulletHell.js
	find src/* \( ! -name plugin.js -a ! -name sprite.js \) -exec cat '{}' >> BulletHell.js \; -exec printf "\r\n\r\n" >> BulletHell.js \;
docs: src/*.js jsdoc-conf.json
	jsdoc -c jsdoc-conf.json
demo: .PHONY
	cp BulletHell.js demo/js/plugins/BulletHell.js
	zip -r release.zip demo
clean:
	rm -f BulletHell.js
	rm -rf docs
	rm -rf release.zip
