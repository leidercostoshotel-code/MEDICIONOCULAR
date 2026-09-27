/* Lógica de la aplicación: padrón, importar/exportar, hoja de evaluación y guardado local. */
/* ======================= DATOS INICIALES ======================= */
const DATA_INICIAL = [{"n":1,"hc":"","dni":"79725121","ap":"ALBERCA","am":"GALARZA","nom":"AYSELL GHIA CORAL","sexo":"Mujer","fn":"15/06/2016","peso":"","talla":"","od":50,"oi":70,"ao":"AMETROPÍA","ag":"","obs":""},{"n":2,"hc":"","dni":"90084497","ap":"ARROYO","am":"GARCIA","nom":"DOMINIK MATIAS","sexo":"Hombre","fn":"13/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":3,"hc":"","dni":"79666382","ap":"ATANACIO","am":"BELLIDO","nom":"BRIANA CRISTHEL","sexo":"Mujer","fn":"01/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":4,"hc":"","dni":"90136811","ap":"BEENIDO","am":"DELGADO","nom":"SNAYDER REYNALDO","sexo":"Hombre","fn":"13/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":5,"hc":"","dni":"90005228","ap":"BLAS","am":"JARA","nom":"CAMILA XIOMARA","sexo":"Mujer","fn":"04/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":6,"hc":"","dni":"90067362","ap":"CALIXTO","am":"POZO","nom":"BET SÚA","sexo":"Mujer","fn":"07/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":7,"hc":"","dni":"79722654","ap":"CANICELA","am":"SANCHEZ","nom":"DAYRON STEVE","sexo":"Hombre","fn":"14/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":8,"hc":"","dni":"79623464","ap":"CANTO","am":"CAYLLAHUA","nom":"MATHIAS JORDAN","sexo":"Hombre","fn":"15/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":9,"hc":"","dni":"90010038","ap":"CULQUITANTE","am":"BARRAGAN","nom":"CAMIL MATEO","sexo":"Hombre","fn":"26/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":10,"hc":"","dni":"79838727","ap":"DAVALOS","am":"DELGADO","nom":"JARETH JOAO","sexo":"Hombre","fn":"24/01/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":11,"hc":"","dni":"79838727","ap":"GARCIA","am":"HUARI","nom":"ROSA NAYELI","sexo":"Mujer","fn":"30/08/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":12,"hc":"","dni":"90147593","ap":"GONZALES","am":"HUAMAN","nom":"LOHAN","sexo":"Hombre","fn":"10/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":13,"hc":"","dni":"79883621","ap":"HERRERA","am":"HERRERA","nom":"OCXAEL ALEEXANDER","sexo":"Mujer","fn":"11/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":14,"hc":"","dni":"90203993","ap":"ICHPAS","am":"JAVIER","nom":"ELIF KORINA","sexo":"Mujer","fn":"01/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":15,"hc":"","dni":"79989878","ap":"INOÑAN","am":"HURTADO","nom":"ADRIAN ALEXIS","sexo":"Hombre","fn":"31/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":16,"hc":"","dni":"79184104","ap":"LAPA","am":"QUISPE","nom":"ALDAIR ESTEFANO","sexo":"Hombre","fn":"12/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":17,"hc":"","dni":"79970660","ap":"LAURA","am":"CORI","nom":"BRYANA MARINA","sexo":"Mujer","fn":"04/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":18,"hc":"","dni":"79688771","ap":"LAVADO","am":"BARDALES","nom":"BRIANA VALESKA","sexo":"Mujer","fn":"04/03/2015","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":19,"hc":"","dni":"78307664","ap":"LAYANGO","am":"MORALES","nom":"ARIANA GUADALUPE","sexo":"Mujer","fn":"28/11/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":20,"hc":"","dni":"79395874","ap":"MANTILLA","am":"GUILLEN","nom":"SARAI ALEXANDRA","sexo":"Mujer","fn":"15/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":21,"hc":"","dni":"79642264","ap":"MANYA","am":"MORO","nom":"YEILIN ZADIRA","sexo":"Mujer","fn":"09/10/2013","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":22,"hc":"","dni":"79773864","ap":"PILLACA","am":"RIZ","nom":"MARIA TERESA","sexo":"Mujer","fn":"20/11/2015","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":23,"hc":"","dni":"79676687","ap":"PORTOCARRERO","am":"PEREZ","nom":"DOMINIC LEWANDOWSKI","sexo":"Hombre","fn":"21/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":24,"hc":"","dni":"79888098","ap":"PORTOCARRERO","am":"RIOS","nom":"JACK FEREMIDE","sexo":"Hombre","fn":"22/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":25,"hc":"","dni":"79684363","ap":"PRINCIPE","am":"LOPEZ","nom":"JESÉ ABETH","sexo":"Hombre","fn":"22/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":26,"hc":"","dni":"79713897","ap":"QUISPE","am":"SEDANO","nom":"DAYANA","sexo":"Mujer","fn":"05/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":27,"hc":"","dni":"79534319","ap":"ROJAS","am":"YLLANES","nom":"DOMINIC ICARDY","sexo":"Hombre","fn":"16/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":28,"hc":"","dni":"79635301","ap":"SANDOVAL","am":"CASTRO","nom":"YAGO AUGUSTO","sexo":"Hombre","fn":"20/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":29,"hc":"","dni":"79963081","ap":"SERVA","am":"SANTOS","nom":"GUADALUPE YESMI SOFIA","sexo":"Mujer","fn":"18/02/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":30,"hc":"","dni":"90040761","ap":"SINCHI","am":"PEREZ","nom":"DANIEL ALBERTO","sexo":"Hombre","fn":"15/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":31,"hc":"","dni":"79826897","ap":"TORRES","am":"ISIDRO","nom":"MACKENZYE KRISTHEL DAYARA","sexo":"Mujer","fn":"24/11/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":32,"hc":"","dni":"79814280","ap":"VENTURA","am":"VILCA","nom":"ANGEL JOSE","sexo":"Hombre","fn":"22/01/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":33,"hc":"","dni":"","ap":"YACTAYO","am":"MALCA","nom":"MIA KALESSSY GEORGETTE","sexo":"Mujer","fn":"22/08/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":34,"hc":"","dni":"","ap":"YANCAN","am":"ROSAS","nom":"CAYETANNA SKARLET","sexo":"Mujer","fn":"06/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":35,"hc":"","dni":"90145111","ap":"AYMA","am":"QQUEHUARUCHO","nom":"ADRIANA","sexo":"Mujer","fn":"13/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":36,"hc":"","dni":"90179992","ap":"CANICELA","am":"HILARIO","nom":"DANA MELANIE XIOMARA","sexo":"Mujer","fn":"24/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":37,"hc":"","dni":"79820873","ap":"CANO","am":"DOMINGUEZ","nom":"MÍA JESSAMIN","sexo":"Mujer","fn":"22/08/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":38,"hc":"","dni":"90039702","ap":"CERVERA","am":"DONATO","nom":"JUAN LIAM","sexo":"Hombre","fn":"19/01/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":39,"hc":"","dni":"79836681","ap":"CONDORI","am":"RIVERA","nom":"PABLO DAVID","sexo":"Hombre","fn":"18/08/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":40,"hc":"","dni":"79881328","ap":"DIEGO","am":"SOSA","nom":"MAYRIN JISSEL","sexo":"Mujer","fn":"03/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":41,"hc":"","dni":"79974810","ap":"GALINDO","am":"FERNANDEZ","nom":"BAYRON HASSIEL","sexo":"Hombre","fn":"16/11/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":42,"hc":"","dni":"79628881","ap":"GARCIA","am":"HARO","nom":"ABBY KALESSI A NAHIARA","sexo":"Mujer","fn":"12/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":43,"hc":"","dni":"005420623","ap":"GIL","am":"PEREZ","nom":"ISABELLA ALEJANDRA","sexo":"Mujer","fn":"15/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":44,"hc":"","dni":"79849268","ap":"GLORIA","am":"VIZARRETA","nom":"DIEGO JHERICO","sexo":"Hombre","fn":"01/09/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":45,"hc":"","dni":"79764743","ap":"GOMEZ","am":"PEREZ","nom":"DÁRIAN ELIAS","sexo":"Hombre","fn":"14/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":46,"hc":"","dni":"79741236","ap":"GUZMAN","am":"ISIDRO","nom":"OSCAR JOSUE ARMANDO","sexo":"Hombre","fn":"23/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":47,"hc":"","dni":"148247806","ap":"LLACSAHUACHE","am":"SALEN","nom":"HILARY VALERIA","sexo":"Mujer","fn":"15/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":48,"hc":"","dni":"79628810","ap":"MELENDEZ","am":"CHIPA","nom":"ARELY ADRIANA","sexo":"Mujer","fn":"05/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":49,"hc":"","dni":"90010792","ap":"MENDOZA","am":"NEYRA","nom":"ARELY DARLETH","sexo":"Mujer","fn":"27/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":50,"hc":"","dni":"79499352","ap":"MONTOYA","am":"ALFARO","nom":"KIARA ASHLY","sexo":"Mujer","fn":"24/01/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":51,"hc":"","dni":"","ap":"MORENO","am":"TUA","nom":"YOSEANYELIS ALEJANDRA","sexo":"Mujer","fn":"15/05/2013","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":52,"hc":"","dni":"79876709","ap":"MOYA","am":"CESPEDES","nom":"ALEX SANDRO","sexo":"Hombre","fn":"30/09/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":53,"hc":"","dni":"90184651","ap":"NAJERA","am":"ALZAMORA","nom":"ADRIAN VALENTINO","sexo":"Hombre","fn":"12/11/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":54,"hc":"","dni":"90064502","ap":"PAREDES","am":"MONDRAGON","nom":"JARITZA OTILIA","sexo":"Mujer","fn":"06/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":55,"hc":"","dni":"90042362","ap":"PARI","am":"CARRASCO","nom":"ALONDRA VALERIA","sexo":"Mujer","fn":"27/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":56,"hc":"","dni":"78909032","ap":"PARRA","am":"PAUCAR","nom":"MARICIELO NAOMI","sexo":"Mujer","fn":"23/12/2014","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":57,"hc":"","dni":"90110285","ap":"PEREZ","am":"PIO","nom":"IVETH MELANI","sexo":"Mujer","fn":"06/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":58,"hc":"","dni":"79515846","ap":"PEREZ","am":"SANTA CRUZ","nom":"MARIA FERNANDA","sexo":"Mujer","fn":"08/01/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":59,"hc":"","dni":"80701953","ap":"QUISPE","am":"AGUIRRE","nom":"THIAGO GAEL","sexo":"Hombre","fn":"08/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":60,"hc":"","dni":"81358132","ap":"RAMIRES","am":"CABRERA","nom":"JHUNPIO GRAVIELITO","sexo":"Hombre","fn":"06/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":61,"hc":"","dni":"90155899","ap":"RAMIREZ","am":"HENCKE","nom":"ANGELI SOFIA","sexo":"Mujer","fn":"04/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":62,"hc":"","dni":"79769919","ap":"REYES","am":"MORALES","nom":"THIAGO DYLAN","sexo":"Hombre","fn":"12/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":63,"hc":"","dni":"90144525","ap":"RODRIGUEZ","am":"BERROSPI","nom":"JOSUE","sexo":"Hombre","fn":"12/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":64,"hc":"","dni":"79720467","ap":"SANTOS","am":"HERRERA","nom":"KATHERIN VALERIA","sexo":"Mujer","fn":"17/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":66,"hc":"","dni":"79922927","ap":"TADEO","am":"REYES","nom":"SECIA RODIT","sexo":"Mujer","fn":"16/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":67,"hc":"","dni":"79899760","ap":"TANTAVILCA","am":"SALAS","nom":"MIA BRISELL","sexo":"Mujer","fn":"15/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":68,"hc":"","dni":"79702661","ap":"TOLEDO","am":"CLAUDIO","nom":"ARIANA AYZEL","sexo":"Mujer","fn":"30/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":69,"hc":"","dni":"79577647","ap":"TORRES","am":"ROJAS","nom":"JOHANNA MARGOT","sexo":"Mujer","fn":"03/03/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":70,"hc":"","dni":"79764345","ap":"ACUÑA","am":"PALOMINO","nom":"ANGHEL GUADALUPE","sexo":"Mujer","fn":"12/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":71,"hc":"","dni":"79918637","ap":"ALVAREZ","am":"SANDOVAL","nom":"ANDREA","sexo":"Mujer","fn":"30/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":72,"hc":"","dni":"79213796","ap":"ARCOS","am":"CANO","nom":"DIEGO ADRIANO","sexo":"Hombre","fn":"30/06/2015","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":73,"hc":"","dni":"79888353","ap":"ASCA","am":"CABEZAS","nom":"ARIANA VALENTINA","sexo":"Mujer","fn":"13/09/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":74,"hc":"","dni":"79745983","ap":"ATANACIO","am":"ALIAGA","nom":"JORDAN LEONEL","sexo":"Hombre","fn":"15/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":75,"hc":"","dni":"79807136","ap":"BOZA","am":"MAYTA","nom":"LUZIANA XOANA","sexo":"Mujer","fn":"15/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":76,"hc":"","dni":"79990841","ap":"CABRERA","am":"PECHO","nom":"SAORI MARISOL","sexo":"Mujer","fn":"17/09/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":77,"hc":"","dni":"79785115","ap":"CARDENAS","am":"ANAYA","nom":"KAIRA ELIF JASSMIN","sexo":"Mujer","fn":"30/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":78,"hc":"","dni":"79836970","ap":"CARHUACUSMA","am":"ALVAREZ","nom":"TRIANNA ANGELY","sexo":"Mujer","fn":"25/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":79,"hc":"","dni":"79648404","ap":"CASTILLO","am":"PRADO","nom":"THIAGO JARETH","sexo":"Hombre","fn":"25/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":80,"hc":"","dni":"90053955","ap":"CHACHAYMA","am":"ACUÑA","nom":"VICTOR NAHIR ARAMIS","sexo":"Hombre","fn":"11/11/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":81,"hc":"","dni":"90081896","ap":"CHAGUA","am":"ROSARIO","nom":"EMILY BRIANA","sexo":"Mujer","fn":"16/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":82,"hc":"","dni":"79753822","ap":"CHAVEZ","am":"CANDIA","nom":"DAMARIS YAREL","sexo":"Mujer","fn":"07/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":83,"hc":"","dni":"90154423","ap":"CONTRERAS","am":"HERRERA","nom":"DYLAN GAEL","sexo":"Hombre","fn":"30/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":84,"hc":"","dni":"79848231","ap":"CORI","am":"ARIAS","nom":"LEIDY ZARA","sexo":"Mujer","fn":"10/09/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":85,"hc":"","dni":"79360362","ap":"CORIPUNA","am":"GARCIA","nom":"MIGUEL ANGEL","sexo":"Hombre","fn":"25/10/2015","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":86,"hc":"","dni":"79956329","ap":"DE LA CRUZ","am":"NUÑEZ","nom":"THIAGO JOSIAS","sexo":"Hombre","fn":"24/11/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":87,"hc":"","dni":"81691444","ap":"ESCOBAR","am":"CONTRERAS","nom":"AARÓN JEHÚ","sexo":"Hombre","fn":"19/11/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":88,"hc":"","dni":"79724785","ap":"GARCIA","am":"FLORES","nom":"NICOLÁS MANUEL","sexo":"Hombre","fn":"15/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":89,"hc":"","dni":"90159134","ap":"GASTON","am":"CHIRA","nom":"PITTER LIAM RUDY","sexo":"Hombre","fn":"12/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":90,"hc":"","dni":"79987329","ap":"IRAZABAL","am":"CABADA","nom":"MARIANA DAENERYS","sexo":"Mujer","fn":"11/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":91,"hc":"","dni":"","ap":"JIMENEZ","am":"FIGUEROA","nom":"ANDY JOSUE","sexo":"Hombre","fn":"12/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":92,"hc":"","dni":"90004036","ap":"MARCAÑAUPA","am":"LIZANA","nom":"YAMILA ALISON","sexo":"Mujer","fn":"28/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":93,"hc":"","dni":"79965235","ap":"MIRANDA","am":"YOVERA","nom":"MATEO DEL PIERO","sexo":"Hombre","fn":"19/11/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":94,"hc":"","dni":"79901102","ap":"MONRROY","am":"CABALLERO","nom":"DALESKA ANTONELLA","sexo":"Mujer","fn":"16/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":95,"hc":"","dni":"81690913","ap":"PACAYA","am":"FIGUEROA","nom":"SAMMY HANSER","sexo":"Hombre","fn":"05/11/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":96,"hc":"","dni":"79686762","ap":"PEÑA","am":"DE LA CRUZ","nom":"LIANA VALERY","sexo":"Mujer","fn":"25/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":97,"hc":"","dni":"79738186","ap":"QUISPE","am":"RAMOS","nom":"JOSE MIGUEL","sexo":"Hombre","fn":"29/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":98,"hc":"","dni":"90094366","ap":"RAMOS","am":"SAYES","nom":"JELO JAMES SEBASTIAN","sexo":"Hombre","fn":"04/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":99,"hc":"","dni":"","ap":"REYES","am":"FAJARDO","nom":"HELEANNYS JULIEHT","sexo":"Mujer","fn":"13/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":101,"hc":"","dni":"90016410","ap":"RICHARDZON","am":"MAMANI","nom":"DIEGO ALONSO","sexo":"Hombre","fn":"14/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":102,"hc":"","dni":"79792639","ap":"SANCHEZ","am":"AYAMAMANI","nom":"KALET RONAL","sexo":"Hombre","fn":"08/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":103,"hc":"","dni":"79998365","ap":"SEDANO","am":"REYMUNDO","nom":"SHEYLA EMILY","sexo":"Mujer","fn":"26/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":104,"hc":"","dni":"91067398","ap":"SEGOVIA","am":"PALOMINO","nom":"LIAM ESTEFANO ELI","sexo":"Hombre","fn":"27/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":105,"hc":"","dni":"90103115","ap":"SILVA","am":"GARCIA","nom":"BRIANNA KALESSY","sexo":"Mujer","fn":"27/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":106,"hc":"","dni":"79897449","ap":"TOLENTINO","am":"BELLIDO","nom":"PIERO GARETH","sexo":"Hombre","fn":"20/09/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":107,"hc":"","dni":"90136257","ap":"VALENCIA","am":"TITO","nom":"BIANCA GAELA","sexo":"Mujer","fn":"23/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":108,"hc":"","dni":"79905701","ap":"ALANIA","am":"HUAMAN","nom":"JOSIMAR","sexo":"Hombre","fn":"19/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":109,"hc":"","dni":"79775089","ap":"ARAUCO","am":"SULLCARAY","nom":"GABRIEL MITCHAEL","sexo":"Hombre","fn":"19/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":110,"hc":"","dni":"90003371","ap":"ASMAD","am":"DURAND","nom":"AMIR KALEL","sexo":"Hombre","fn":"10/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":111,"hc":"","dni":"79822503","ap":"BLAS","am":"ALVAREZ","nom":"NICOLAS","sexo":"Hombre","fn":"21/08/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":112,"hc":"","dni":"90072892","ap":"CAHUANA","am":"MATOS","nom":"DYLAN KYLE STEV","sexo":"Hombre","fn":"16/01/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":113,"hc":"","dni":"79635536","ap":"CANCHANYA","am":"SULLCA","nom":"JOEL OBED","sexo":"Hombre","fn":"12/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":114,"hc":"","dni":"79780195","ap":"CARLOS","am":"CAHUANA","nom":"MARLON","sexo":"Hombre","fn":"26/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":115,"hc":"","dni":"90193378","ap":"CASTAÑEDA","am":"VEGA","nom":"FLOR DE MARIA NICKOL","sexo":"Mujer","fn":"31/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":116,"hc":"","dni":"79770416","ap":"CORDOVA","am":"ATANACIO","nom":"JAMILA HEIZEL SAETH","sexo":"Mujer","fn":"22/06/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":117,"hc":"","dni":"79360359","ap":"CORIPUNA","am":"GARCIA","nom":"ZARAI CRISTAL","sexo":"Mujer","fn":"25/10/2015","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":119,"hc":"","dni":"79736124","ap":"DOMINGUEZ","am":"SILVA","nom":"DILAN JOEL","sexo":"Hombre","fn":"01/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":122,"hc":"","dni":"90090950","ap":"ESTRADA","am":"ATASI","nom":"ROMINA JAEL","sexo":"Mujer","fn":"13/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":123,"hc":"","dni":"79700211","ap":"FABIAN","am":"PAJUELO","nom":"KAORY CRYSTAL","sexo":"Mujer","fn":"25/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":124,"hc":"","dni":"79670222","ap":"FIGUEREDO","am":"ROMANI","nom":"CLARA MICHELL","sexo":"Mujer","fn":"07/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":125,"hc":"","dni":"90061416","ap":"GALARZA","am":"LIMAYLLA","nom":"ANALIA ALESSANDRA","sexo":"Mujer","fn":"01/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":126,"hc":"","dni":"90009055","ap":"GARCIA","am":"NOA","nom":"MATIAS JOAQUIN","sexo":"Hombre","fn":"31/12/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":127,"hc":"","dni":"79845267","ap":"HUAMAN","am":"MORA","nom":"JAEL JAYCO","sexo":"Hombre","fn":"10/09/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":128,"hc":"","dni":"90169399","ap":"INGA","am":"QUINTANA","nom":"DARELL AUSTIN","sexo":"Hombre","fn":"21/03/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":129,"hc":"","dni":"79683747","ap":"MANDUJANO","am":"ROJAS","nom":"MILAN VALENTINO JAVIER","sexo":"Hombre","fn":"19/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":130,"hc":"","dni":"90079668","ap":"MAVILA","am":"QUISPE","nom":"SHANTAL PIERINA DAMILENCKA","sexo":"Mujer","fn":"06/01/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":131,"hc":"","dni":"79686848","ap":"MISARI","am":"GONZALES","nom":"FABIO ALESSANDRO","sexo":"Hombre","fn":"27/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":132,"hc":"","dni":"90134991","ap":"MONTENEGRO","am":"YACTAYO","nom":"ALONDRA MICAELA","sexo":"Mujer","fn":"25/02/2017","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":133,"hc":"","dni":"79362607","ap":"PAREDES","am":"PADILLA","nom":"JEREMIAS DANIEL","sexo":"Hombre","fn":"06/10/2015","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":135,"hc":"","dni":"82031480","ap":"SANTA CRUZ","am":"TANANTA","nom":"KALESSSY YUSBETT","sexo":"Mujer","fn":"16/07/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":136,"hc":"","dni":"79660338","ap":"SARAVIA","am":"ALVIS","nom":"JOSUE ULISES MANUEL","sexo":"Hombre","fn":"19/04/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":137,"hc":"","dni":"79812336","ap":"SERAFIN","am":"JAVIER","nom":"THIAGO DAYIRO","sexo":"Hombre","fn":"13/08/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":138,"hc":"","dni":"79897435","ap":"SOLORZANO","am":"QUISPE","nom":"JHOAO ARMANDO","sexo":"Hombre","fn":"10/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":139,"hc":"","dni":"79696312","ap":"SOTO","am":"SALAZAR","nom":"LUZ YENY","sexo":"Mujer","fn":"02/06/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":140,"hc":"","dni":"79674819","ap":"TACURI","am":"SANTOS","nom":"GUILBERTH FRAY","sexo":"Hombre","fn":"07/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":141,"hc":"","dni":"79926522","ap":"VICTORIO","am":"SANTE","nom":"ELMER GAEL","sexo":"Hombre","fn":"02/10/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":142,"hc":"","dni":"79818333","ap":"VILLANUEVA","am":"ARMAS","nom":"JARECK DAVID","sexo":"Hombre","fn":"05/08/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""},{"n":143,"hc":"","dni":"79692050","ap":"VIZCARRA","am":"FIGUEROA","nom":"HEYZEL BIANCA","sexo":"Mujer","fn":"19/05/2016","peso":"","talla":"","od":"","oi":"","ao":"","ag":"","obs":""}];
const ANT_OFT = ["AMETROPÍA","BLEFARITIS","CATARATA","CONJUNTIVITIS","ESTRABISMO","GLAUCOMA","RETINOPATÍA","TRAUMATISMOS"];
const COLS = ["n","hc","dni","ap","am","nom","sexo","fn","peso","talla","imc","edad","nombre","od","oi","ao","ag","obs"];
const HEADERS = ["N°","HC","Número de Documento","Apellido Paterno","Apellido Materno","Nombres","Sexo","Fecha de Nacimiento","PESO","TALLA","IMC","Edad","Apellidos y Nombres","OD","OI","ANTECEDENTES OFTALMOLÓGICOS","ANTECEDENTES GENERALES","OBSERVACIÓN"];
const LS_PAC = "salud_ocular_pacientes_v1";
const LS_EVAL = "salud_ocular_evaluaciones_v1";

let pacientes = [];
let evaluaciones = {};
let numActual = null;

/* ======================= UTILIDADES ======================= */
function msg(t){const m=document.getElementById('msg');m.textContent=t;m.classList.add('show');clearTimeout(msg._t);msg._t=setTimeout(()=>m.classList.remove('show'),2200);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function num(v){if(v===""||v==null)return null;const n=parseFloat(String(v).replace(",","."));return isNaN(n)?null:n;}
function parseFecha(s){ // dd/mm/aaaa
  if(!s)return null;const m=String(s).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);if(!m)return null;
  let y=parseInt(m[3]);if(y<100)y+=y<30?2000:1900;const d=new Date(y,parseInt(m[2])-1,parseInt(m[1]));
  return isNaN(d)?null:d;
}
function calcEdad(fn){const d=parseFecha(fn);if(!d)return "";const h=new Date();let e=h.getFullYear()-d.getFullYear();const m=h.getMonth()-d.getMonth();if(m<0||(m===0&&h.getDate()<d.getDate()))e--;return e<0?"":String(e);}
function calcIMC(p,t){const P=num(p),T=num(t);if(P==null||T==null||T<=0)return "";return (P/(T*T)).toFixed(2);}
function calcNombre(r){return [r.ap,r.am,r.nom].map(x=>String(x||"").trim()).filter(Boolean).join(" ");}
function hoy(){const d=new Date();return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);}
function nuevoRegistro(){return {id:uid(),n:"",hc:"",dni:"",ap:"",am:"",nom:"",sexo:"",fn:"",peso:"",talla:"",od:"",oi:"",ao:"",ag:"",obs:""};}
function normalizar(r){const o=nuevoRegistro();for(const k in o){if(r[k]!=null)o[k]=r[k];}o.id=String(o.id||uid());o.n=parseInt(o.n);if(isNaN(o.n))o.n="";o.dni=String(o.dni||"").replace(/\D/g,"");return o;}

/* ======================= PERSISTENCIA ======================= */
function cargar(){
  try{const p=JSON.parse(localStorage.getItem(LS_PAC));if(Array.isArray(p)&&p.length)pacientes=p.map(normalizar);}catch(e){}
  if(!pacientes.length)pacientes=DATA_INICIAL.map(normalizar);
  try{evaluaciones=JSON.parse(localStorage.getItem(LS_EVAL))||{};}catch(e){evaluaciones={};}
}
function guardarPacientes(){try{localStorage.setItem(LS_PAC,JSON.stringify(pacientes));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync)Sync.programarPacientes();}
function guardarEvaluaciones(){try{localStorage.setItem(LS_EVAL,JSON.stringify(evaluaciones));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync)Sync.programarEvaluaciones();}

/* ======================= VISTAS ======================= */
function showView(v){
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===v));
  document.getElementById('tabDatos').classList.toggle('active',v==='datos');
  document.getElementById('tabEval').classList.toggle('active',v==='evaluacion');
  if(v==='evaluacion'){cargarPaciente(document.getElementById('numPac').value);}
}

/* ======================= TABLA DATOS ======================= */
function renderDatos(){
  const q=document.getElementById('search').value.trim().toLowerCase();
  const tb=document.getElementById('tbodyDatos');
  const rows=pacientes.map((r,i)=>({r,i})).filter(({r})=>{
    if(!q)return true;
    const s=[r.n,r.hc,r.dni,r.ap,r.am,r.nom,calcNombre(r),r.sexo,r.fn,r.ao,r.ag,r.obs].join(" ").toLowerCase();
    return s.includes(q);
  });
  const html=rows.map(({r,i})=>`
  <tr data-i="${i}" data-id="${esc(r.id)}">
    <td class="num"><input class="w-num" data-k="n" value="${esc(r.n)}" style="text-align:center;font-weight:bold"></td>
    <td><input data-k="hc" value="${esc(r.hc)}"></td>
    <td><input data-k="dni" value="${esc(r.dni)}" maxlength="8" inputmode="numeric" class="${r.dni&&r.dni.length!==8?'invalid':''}"></td>
    <td><input data-k="ap" value="${esc(r.ap)}"></td>
    <td><input data-k="am" value="${esc(r.am)}"></td>
    <td><input data-k="nom" value="${esc(r.nom)}"></td>
    <td><select data-k="sexo"><option value=""></option><option ${r.sexo==='Hombre'?'selected':''}>Hombre</option><option ${r.sexo==='Mujer'?'selected':''}>Mujer</option></select></td>
    <td><input data-k="fn" value="${esc(r.fn)}" placeholder="dd/mm/aaaa" class="${r.fn&&!parseFecha(r.fn)?'invalid':''}"></td>
    <td><input data-k="peso" value="${esc(r.peso)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="talla" value="${esc(r.talla)}" inputmode="decimal" style="text-align:center"></td>
    <td class="calc" data-c="imc">${calcIMC(r.peso,r.talla)}</td>
    <td class="calc" data-c="edad">${calcEdad(r.fn)}</td>
    <td class="calc" data-c="nombre" style="text-align:left">${esc(calcNombre(r))}</td>
    <td><input data-k="od" value="${esc(r.od)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="oi" value="${esc(r.oi)}" inputmode="decimal" style="text-align:center"></td>
    <td><select data-k="ao"><option value=""></option>${ANT_OFT.map(a=>`<option ${r.ao===a?'selected':''}>${a}</option>`).join("")}</select></td>
    <td><input data-k="ag" value="${esc(r.ag)}"></td>
    <td><input data-k="obs" value="${esc(r.obs)}"></td>
    <td class="actions"><button title="Eliminar fila" onclick="delRow(${i})">✕</button></td>
  </tr>`).join("");
  tb.innerHTML=html;
  document.getElementById('emptyMsg').style.display=rows.length?'none':'block';
  document.getElementById('countInfo').textContent=`${rows.length} de ${pacientes.length} registros`;
}
document.getElementById('tbodyDatos').addEventListener('input',e=>{
  const el=e.target,tr=el.closest('tr');if(!tr||!el.dataset.k)return;
  const r=pacientes[+tr.dataset.i];let v=el.value;
  if(el.dataset.k==='dni'){v=v.replace(/\D/g,"").slice(0,8);el.value=v;el.classList.toggle('invalid',v.length>0&&v.length!==8);}
  if(el.dataset.k==='n'){const n=parseInt(v);v=isNaN(n)?"":n;}
  if(el.dataset.k==='fn'){el.classList.toggle('invalid',!!v&&!parseFecha(v));}
  r[el.dataset.k]=v;
  tr.querySelector('[data-c=imc]').textContent=calcIMC(r.peso,r.talla);
  tr.querySelector('[data-c=edad]').textContent=calcEdad(r.fn);
  tr.querySelector('[data-c=nombre]').textContent=calcNombre(r);
  guardarPacientes();
});
document.getElementById('tbodyDatos').addEventListener('change',e=>{ // selects
  const el=e.target,tr=el.closest('tr');if(!tr||!el.dataset.k||el.tagName!=='SELECT')return;
  pacientes[+tr.dataset.i][el.dataset.k]=el.value;guardarPacientes();
});
function addRow(){
  const max=pacientes.reduce((m,r)=>Math.max(m,parseInt(r.n)||0),0);
  const r=nuevoRegistro();r.n=max+1;pacientes.push(r);guardarPacientes();
  document.getElementById('search').value="";renderDatos();
  const wrap=document.getElementById('datosWrap');wrap.scrollTop=wrap.scrollHeight;
  const last=document.querySelector('#tbodyDatos tr:last-child input[data-k=hc]');if(last)last.focus();
  msg("Fila N° "+r.n+" agregada");
}
function delRow(i){
  const r=pacientes[i];if(!confirm(`¿Eliminar la fila N° ${r.n} (${calcNombre(r)||'sin nombre'})?`))return;
  pacientes.splice(i,1);guardarPacientes();renderDatos();msg("Fila eliminada");
}
function resetData(){
  if(!confirm("Se reemplazará el padrón actual por los datos originales del archivo. ¿Continuar?"))return;
  pacientes=DATA_INICIAL.map(normalizar);guardarPacientes();renderDatos();msg("Datos originales restaurados");
}

/* ======================= IMPORTAR / EXPORTAR ======================= */
function parseCSV(text){
  text=text.replace(/^﻿/,"");
  const first=text.split(/\r?\n/)[0]||"";
  const delim=(first.split(";").length>first.split(",").length)?";":(first.split("\t").length>first.split(",").length?"\t":",");
  const rows=[];let row=[],cur="",inq=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(inq){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++;}else inq=false;}else cur+=c;}
    else{if(c==='"')inq=true;else if(c===delim){row.push(cur);cur="";}else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur="";}else if(c==='\r'){}else cur+=c;}
  }
  if(cur!==""||row.length){row.push(cur);rows.push(row);}
  return rows.filter(r=>r.some(x=>String(x).trim()!==""));
}
function filasAPacientes(rows){
  if(!rows.length)return [];
  const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"");
  const hdr=rows[0].map(norm);
  const map={n:["n","no","num","numero","nro"],hc:["hc","historia","nhistoria","historiaclinica"],dni:["numerodedocumento","dni","documento","nrodocumento","numdoc"],ap:["apellidopaterno","appaterno","paterno"],am:["apellidomaterno","apmaterno","materno"],nom:["nombres","nombre"],sexo:["sexo","genero"],fn:["fechadenacimiento","fechanacimiento","fnac","nacimiento"],peso:["peso","pesokg"],talla:["talla","tallam"],od:["od","ojoderecho"],oi:["oi","ojoizquierdo"],ao:["antecedentesoftalmologicos","antecedentesoftamologicos","antoftalmologicos","oftalmologicos"],ag:["antecedentesgenerales","antgenerales","generales"],obs:["observacion","observaciones","obs"]};
  const idx={};let hits=0;
  for(const k in map){const j=hdr.findIndex(h=>map[k].includes(h));if(j>=0){idx[k]=j;hits++;}}
  let body=rows.slice(1);
  if(hits<4){ // sin encabezado reconocible: usar orden de columnas
    body=rows;COLS.forEach((k,j)=>{idx[k]=j;});delete idx.imc;delete idx.edad;delete idx.nombre;
    if(isNaN(parseInt(rows[0][0])))body=rows.slice(1);
  }
  const out=[];
  for(const r of body){const o=nuevoRegistro();for(const k in idx){let v=r[idx[k]];if(v==null)v="";o[k]=String(v).trim();}
    if(o.fn&&/^\d{4,5}$/.test(o.fn)){const d=new Date(Date.UTC(1899,11,30)+parseInt(o.fn)*86400000);o.fn=String(d.getUTCDate()).padStart(2,"0")+"/"+String(d.getUTCMonth()+1).padStart(2,"0")+"/"+d.getUTCFullYear();}
    if(o.n===""&&o.dni===""&&o.ap===""&&o.nom==="")continue;
    out.push(normalizar(o));}
  return out;
}
function importFile(inp){
  const f=inp.files[0];if(!f)return;inp.value="";
  const done=rows=>{
    const nuevos=filasAPacientes(rows);
    if(!nuevos.length){msg("No se encontraron registros válidos");return;}
    const modo=confirm(`Se leyeron ${nuevos.length} registros.\n\nAceptar = REEMPLAZAR el padrón actual\nCancelar = AGREGAR al padrón actual`);
    if(modo){pacientes=nuevos;}else{let max=pacientes.reduce((m,r)=>Math.max(m,parseInt(r.n)||0),0);nuevos.forEach(r=>{if(r.n===""||pacientes.some(p=>p.n===r.n))r.n=++max;else max=Math.max(max,r.n);pacientes.push(r);});}
    guardarPacientes();renderDatos();msg(`${nuevos.length} registros importados`);
  };
  if(/\.(xlsx|xls)$/i.test(f.name)){
    if(typeof XLSX==="undefined"){alert("No se pudo cargar la librería de Excel (sin conexión). Importe el archivo como CSV.");return;}
    const rd=new FileReader();rd.onload=e=>{const wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"});
      const name=wb.SheetNames.find(n=>/datos/i.test(n))||wb.SheetNames[0];
      let rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:""});
      rows=rows.filter(r=>r.some(x=>String(x).trim()!==""));done(rows);};
    rd.readAsArrayBuffer(f);
  }else{
    const rd=new FileReader();rd.onload=e=>done(parseCSV(e.target.result));rd.readAsText(f,"UTF-8");
  }
}
function filaExport(r){return [r.n,r.hc,r.dni,r.ap,r.am,r.nom,r.sexo,r.fn,r.peso,r.talla,calcIMC(r.peso,r.talla),calcEdad(r.fn),calcNombre(r),r.od,r.oi,r.ao,r.ag,r.obs];}
function descargar(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function exportCSV(){
  const q=v=>{v=String(v==null?"":v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  const lines=[HEADERS.map(q).join(";")].concat(pacientes.map(r=>filaExport(r).map(q).join(";")));
  descargar(new Blob(["﻿"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),"Datos_Salud_Ocular.csv");msg("CSV exportado");
}
function exportXLSX(){
  if(typeof XLSX==="undefined"){msg("Sin librería Excel (sin conexión): se exporta CSV");exportCSV();return;}
  const aoa=[HEADERS].concat(pacientes.map(r=>filaExport(r).map((v,j)=>{ if([0,8,9,10,11,13,14].includes(j)){const n=num(v);return n==null?"":n;} return v;})));
  const ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[6,8,14,16,16,24,8,14,8,8,8,6,34,6,6,26,26,26].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Datos");
  // Hoja de evaluaciones guardadas
  const evs=Object.keys(evaluaciones).sort((a,b)=>a-b);
  if(evs.length){const keys=[...new Set(evs.flatMap(k=>Object.keys(evaluaciones[k])))];
    const ws2=XLSX.utils.aoa_to_sheet([["N°",...keys]].concat(evs.map(k=>[parseInt(k),...keys.map(x=>evaluaciones[k][x]||"")])));
    XLSX.utils.book_append_sheet(wb,ws2,"Evaluaciones");}
  XLSX.writeFile(wb,"Datos_Salud_Ocular.xlsx");msg("Excel exportado");
}

/* ======================= EVALUACIÓN OCULAR ======================= */
const AUTO_KEYS={
  hc:r=>r.hc, dni:r=>r.dni, nombre:r=>calcNombre(r), edad:r=>calcEdad(r.fn), sexo:r=>r.sexo,
  peso:r=>r.peso, talla:r=>r.talla, imc:r=>calcIMC(r.peso,r.talla), od:r=>r.od, oi:r=>r.oi,
  dx1:r=>{const a=num(r.od),b=num(r.oi);return ((a!=null&&a>=50)||(b!=null&&b>=50))?"A":"N";}
};
function buscarPaciente(n){n=parseInt(n);if(isNaN(n))return null;return pacientes.find(r=>parseInt(r.n)===n)||null;}
function setAutos(r){
  document.querySelectorAll('#sheet [data-auto]').forEach(el=>{el.value=r?String(AUTO_KEYS[el.dataset.auto](r)??""):"";});
}
function campos(){return document.querySelectorAll('#sheet [data-f]');}
function leerForm(){
  const o={};campos().forEach(el=>{if(el.classList.contains('chk'))o[el.dataset.f]=el.classList.contains('on')?"X":"";else o[el.dataset.f]=el.value;});return o;
}
function escribirForm(o){
  campos().forEach(el=>{const v=o&&o[el.dataset.f]!=null?o[el.dataset.f]:(el.dataset.f==='ev_nombre'?"Dra Mari Alba Mas":"");
    if(el.classList.contains('chk'))el.classList.toggle('on',v==="X");else el.value=v;});
}
function cargarPaciente(n){
  const r=buscarPaciente(n);numActual=r?parseInt(r.n):null;
  setAutos(r);
  const info=document.getElementById('evalInfo'),tag=document.getElementById('savedTag');
  if(!r){escribirForm(null);info.textContent=String(n||"").trim()?`N° ${n}: no existe en DATOS`:"Escriba el N° del paciente en la casilla del formulario";tag.textContent="";return;}
  info.textContent=`N° ${r.n} · ${calcNombre(r)}`;
  const ev=evaluaciones[r.n];
  if(ev){escribirForm(ev);tag.textContent="✔ Evaluación guardada";}
  else{
    escribirForm(null);tag.textContent="";
    // marcar automáticamente la patología oftalmológica elegida en DATOS
    if(r.ao){const key=slug(r.ao);const od=document.querySelector(`#sheet .chk[data-f="ao_${key}_od"]`),oi=document.querySelector(`#sheet .chk[data-f="ao_${key}_oi"]`);if(od)od.classList.add('on');if(oi)oi.classList.add('on');}
  }
}
function slug(s){return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"");}
function guardarEval(){
  if(numActual==null){alert("Primero escriba un N° de paciente válido.");return;}
  evaluaciones[numActual]=leerForm();guardarEvaluaciones();
  document.getElementById('savedTag').textContent="✔ Evaluación guardada";msg(`Evaluación del N° ${numActual} guardada`);
}
function limpiarEval(){
  if(numActual!=null&&evaluaciones[numActual]){
    if(!confirm(`¿Borrar la evaluación guardada del N° ${numActual}?`))return;
    delete evaluaciones[numActual];guardarEvaluaciones();
  }
  cargarPaciente(document.getElementById('numPac').value);msg("Formulario limpio");
}
function navPaciente(dir){
  const ns=[...new Set(pacientes.map(r=>parseInt(r.n)).filter(n=>!isNaN(n)))].sort((a,b)=>a-b);
  if(!ns.length)return;
  let cur=parseInt(document.getElementById('numPac').value);let next;
  if(isNaN(cur))next=dir>0?ns[0]:ns[ns.length-1];
  else{const i=ns.indexOf(cur);
    if(i>=0)next=ns[Math.min(ns.length-1,Math.max(0,i+dir))];
    else{next=dir>0?(ns.find(n=>n>cur)??ns[ns.length-1]):([...ns].reverse().find(n=>n<cur)??ns[0]);}}
  document.getElementById('numPac').value=next;cargarPaciente(next);
}
document.getElementById('numPac').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,"");cargarPaciente(e.target.value);});
document.getElementById('sheet').addEventListener('click',e=>{
  const c=e.target.closest('.chk');if(!c)return;c.classList.toggle('on');
  if(c.dataset.f==='trat_si'&&c.classList.contains('on'))document.querySelector('.chk[data-f=trat_no]').classList.remove('on');
  if(c.dataset.f==='trat_no'&&c.classList.contains('on'))document.querySelector('.chk[data-f=trat_si]').classList.remove('on');
});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.key.toLowerCase()==='s'&&document.getElementById('evaluacion').classList.contains('active')){e.preventDefault();guardarEval();}
});

/* ======================= INICIO ======================= */
cargar();renderDatos();escribirForm(null);
