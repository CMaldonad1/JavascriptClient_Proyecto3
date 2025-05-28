**** INSTRUCCIONS PER LLANÇAR CLIENT ANGULAR ****

1) Instalar Node.js (versió 22.15 o superior)

2) Instalar angular mitjançant la següent comanda:
	- npm install -g @angular/cli

3) Per a verificar que la instal·lació s'ha fet correctament llançar..
	- ng version
    La versió  d'angular ha de ser 19.2.9 o superior

4) En la carpeta riskcli llançar les seguents comandes:
	- npm install

5) Per a llançar l'aplicació anar a la carpeta "riskcli" i llançar la comanda:
	- ng serve

6) faltará modificar la IP del servidor. Aquesta es troba al servei "websocket.service.ts" a la següent ruta:
	- riskcli/src/app/services/websocket.service.ts

	- modificar la ip que trobarás en la variable següent:
	private readonly SERVER ='ws://10.200.1.4:8080';
