version:
	@bash -c "source ~/.nvm/nvm.sh && nvm use 23.11"
install:
	npm install --legacy-peer-deps
dev:
	npm run dev
build:
	npm run build
start:
	npm run preview