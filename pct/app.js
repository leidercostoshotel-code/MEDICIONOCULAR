/* PCT · Lógica de la aplicación: padrón, atenciones HIS, registro mensual, importar/exportar y guardado local. */
/* ======================= DATOS INICIALES ======================= */
const DATA_INICIAL = [{"n": 1, "nom": "Gomez Soplapuco Yarla Bardanina", "hc": "200 101", "dni": "37431828", "fn": "", "edad": "18", "sexo": "RM", "dx": "", "peso": "72", "talla": "1.65", "tto": "con"}, {"n": 2, "nom": "Gomez Sopla Mayly Jhono1", "hc": "744 283", "dni": "00031408", "fn": "", "edad": "12", "sexo": "RM", "dx": "", "peso": "48", "talla": "1.5", "tto": "con"}, {"n": 3, "nom": "Baches Gomez Jhanet", "hc": "220 545", "dni": "19085508", "fn": "", "edad": "51", "sexo": "RM", "dx": "", "peso": "82.5", "talla": "1.72", "tto": "con"}, {"n": 4, "nom": "Baches Gomez Cesar Milton", "hc": "220 744", "dni": "20934334", "fn": "", "edad": "32", "sexo": "RM", "dx": "", "peso": "66", "talla": "1.63", "tto": "con"}, {"n": 5, "nom": "Uman Saldivar Gauiter Guindo", "hc": "504 684", "dni": "29938166", "fn": "", "edad": "82", "sexo": "RM", "dx": "", "peso": "95", "talla": "1.645", "tto": "con"}, {"n": 6, "nom": "Uman Saldivar Brayan Uman Karly", "hc": "2207 418", "dni": "77516496", "fn": "", "edad": "18", "sexo": "RM", "dx": "", "peso": "93", "talla": "1.62", "tto": "con"}, {"n": 7, "nom": "No Mazaheuz Jhordy Massiel", "hc": "2205 5616", "dni": "05243504", "fn": "", "edad": "220", "sexo": "RM", "dx": "", "peso": "80", "talla": "1.61", "tto": "con"}, {"n": 8, "nom": "Uman Huanqui Neofita", "hc": "220 4328", "dni": "43069966", "fn": "", "edad": "22", "sexo": "RM", "dx": "", "peso": "87", "talla": "1.62", "tto": "con"}, {"n": 9, "nom": "Chacon Vega William", "hc": "220 204", "dni": "09717206", "fn": "", "edad": "22", "sexo": "RM", "dx": "", "peso": "80", "talla": "1.49", "tto": "con"}, {"n": 10, "nom": "Lompart Melendez Paredes Yoselin Alexandra", "hc": "220 2422", "dni": "20212582", "fn": "", "edad": "33", "sexo": "RM", "dx": "", "peso": "60", "talla": "1.52", "tto": "con"}, {"n": 11, "nom": "Caceres Alarcon Yda Arda Pilar", "hc": "120 392", "dni": "20522663", "fn": "", "edad": "51", "sexo": "RM", "dx": "", "peso": "102", "talla": "1.62", "tto": "con"}, {"n": 12, "nom": "Quispe Ruiz Delia Martha", "hc": "211 617", "dni": "40525211", "fn": "", "edad": "44", "sexo": "RM", "dx": "", "peso": "46", "talla": "1.64", "tto": "con"}, {"n": 13, "nom": "Huamani Quispe Lizvet Soyla", "hc": "2208 74", "dni": "61843214", "fn": "", "edad": "16", "sexo": "RM", "dx": "", "peso": "59", "talla": "1.62", "tto": "con"}, {"n": 14, "nom": "Huamani Quispe Carla", "hc": "042 758", "dni": "61843245", "fn": "", "edad": "16", "sexo": "RM", "dx": "", "peso": "77", "talla": "1.72", "tto": "con"}, {"n": 15, "nom": "Rojas Palomino Brian Quentin", "hc": "405 876", "dni": "91140747", "fn": "", "edad": "17", "sexo": "RM", "dx": "", "peso": "52", "talla": "1.17", "tto": "con"}, {"n": 16, "nom": "Chacara Huachaca Victor", "hc": "2184 2134", "dni": "1051", "fn": "", "edad": "51", "sexo": "RM", "dx": "", "peso": "86.3", "talla": "1.68", "tto": "con"}, {"n": 17, "nom": "Torres Aspajo Andres Joel", "hc": "220 857", "dni": "41565878", "fn": "", "edad": "22", "sexo": "RM", "dx": "", "peso": "111", "talla": "1.72", "tto": "con"}, {"n": 18, "nom": "Lopez Mejia Gemima Del Rosario", "hc": "220 859", "dni": "78056524", "fn": "", "edad": "12", "sexo": "RM", "dx": "", "peso": "69", "talla": "1.58", "tto": "con"}, {"n": 19, "nom": "Huamani Quispe Carlos Alberto", "hc": "220 873", "dni": "40027068", "fn": "", "edad": "20", "sexo": "RM", "dx": "", "peso": "86", "talla": "1.64", "tto": "con"}, {"n": 20, "nom": "Yuto Palomino Yaserin Santosa", "hc": "129 170", "dni": "07374934", "fn": "", "edad": "51", "sexo": "RM", "dx": "", "peso": "96", "talla": "1.75", "tto": "con"}, {"n": 21, "nom": "Salgado Carbostomo Olinda", "hc": "221 190", "dni": "09322201", "fn": "", "edad": "76", "sexo": "RM", "dx": "", "peso": "83", "talla": "1.54", "tto": "con"}, {"n": 22, "nom": "Solis Barrientos Lorena Kiste", "hc": "207 093", "dni": "78768638", "fn": "", "edad": "11", "sexo": "RM", "dx": "", "peso": "61", "talla": "1.25", "tto": "con"}, {"n": 23, "nom": "Barrios Padella Robert", "hc": "221 197", "dni": "40556241", "fn": "", "edad": "60", "sexo": "RM", "dx": "", "peso": "68.7", "talla": "1.55", "tto": "con"}, {"n": 24, "nom": "Nival Carhuamaca Malena Alverda", "hc": "207 190", "dni": "09322201", "fn": "", "edad": "20", "sexo": "RM", "dx": "", "peso": "64", "talla": "1.25", "tto": "con"}, {"n": 25, "nom": "Puca Mazaida Freddy Segundino", "hc": "206 739", "dni": "4001982", "fn": "", "edad": "41", "sexo": "RM", "dx": "", "peso": "76.4", "talla": "1.73", "tto": "con"}, {"n": 26, "nom": "Chinga Gomez Evelyn Judith", "hc": "051 733", "dni": "92960031", "fn": "", "edad": "10", "sexo": "RM", "dx": "", "peso": "59", "talla": "1.55", "tto": "con"}, {"n": 27, "nom": "Solis Olinda Jeico", "hc": "55.00", "dni": "167", "fn": "", "edad": "09", "sexo": "RM", "dx": "", "peso": "55", "talla": "1.67", "tto": "con"}, {"n": 28, "nom": "Solis Olinda Inir Alexander", "hc": "3000", "dni": "1395", "fn": "", "edad": "19", "sexo": "RM", "dx": "", "peso": "30", "talla": "1.395", "tto": "con"}, {"n": 29, "nom": "Ramirez Vera Mercy Haydaly", "hc": "221 446", "dni": "46944477", "fn": "", "edad": "22", "sexo": "RM", "dx": "", "peso": "80.5", "talla": "1.63", "tto": "con"}, {"n": 30, "nom": "Puca Mamani Teddy", "hc": "2063 4982", "dni": "4000", "fn": "", "edad": "39", "sexo": "RM", "dx": "", "peso": "70", "talla": "1.73", "tto": "con"}, {"n": 31, "nom": "Barrios Carhuamaca Thalia", "hc": "203 963", "dni": "91856774", "fn": "", "edad": "15", "sexo": "RM", "dx": "", "peso": "26", "talla": "1.15", "tto": "con"}, {"n": 32, "nom": "Barrios Carhuamaca Kytzie", "hc": "2212 97", "dni": "93284159", "fn": "", "edad": "3", "sexo": "RM", "dx": "", "peso": "13", "talla": "0.926", "tto": "con"}, {"n": 33, "nom": "Chamorro Pacor Jhoatan Anderson", "hc": "221 481", "dni": "75880970", "fn": "", "edad": "10", "sexo": "RM", "dx": "", "peso": "64", "talla": "1.611", "tto": "con"}, {"n": 34, "nom": "Power Hinostroza Mario Victoria", "hc": "2109 10", "dni": "48743894", "fn": "", "edad": "41", "sexo": "RM", "dx": "", "peso": "56", "talla": "1.5", "tto": "con"}, {"n": 35, "nom": "Mamani Huanqui Nestor", "hc": "B15 29", "dni": "41980805", "fn": "", "edad": "24", "sexo": "RM", "dx": "", "peso": "12.1", "talla": "1.69", "tto": "con"}, {"n": 36, "nom": "Valdivia Huiza Mateo", "hc": "2196 24", "dni": "94244780", "fn": "", "edad": "11", "sexo": "RM", "dx": "", "peso": "96", "talla": "1.728", "tto": "con"}, {"n": 37, "nom": "Para Martinez Nictor Jose", "hc": "221 447", "dni": "08454687", "fn": "", "edad": "48", "sexo": "RM", "dx": "", "peso": "73", "talla": "1.7", "tto": "con"}, {"n": 38, "nom": "Salcedo Revelle Dick Alexander", "hc": "2212 98", "dni": "41283960", "fn": "", "edad": "38", "sexo": "RM", "dx": "", "peso": "91", "talla": "1.62", "tto": "con"}, {"n": 39, "nom": "Galindo Panura Greyse Yuliana", "hc": "2216 1285", "dni": "87736", "fn": "", "edad": "21", "sexo": "RM", "dx": "", "peso": "64.5", "talla": "1.506", "tto": "con"}, {"n": 40, "nom": "Perez Ccuno Yuliana", "hc": "2216 227", "dni": "10370079", "fn": "", "edad": "28", "sexo": "RM", "dx": "", "peso": "55", "talla": "1.465", "tto": "con"}, {"n": 41, "nom": "Barreto Panura Meykoly", "hc": "227 91", "dni": "42534648", "fn": "", "edad": "14", "sexo": "RM", "dx": "", "peso": "53", "talla": "1.465", "tto": "con"}, {"n": 42, "nom": "Patas Galindo Nahuel Farid", "hc": "2216 220", "dni": "29056115", "fn": "", "edad": "16", "sexo": "RM", "dx": "", "peso": "59", "talla": "1.62", "tto": "con"}, {"n": 43, "nom": "Nava Sanabria Maria", "hc": "221 837", "dni": "09245320", "fn": "", "edad": "18", "sexo": "RM", "dx": "", "peso": "81.2", "talla": "1.595", "tto": "con"}, {"n": 44, "nom": "Huaman Ccusi Nicole", "hc": "4297 62", "dni": "73570294", "fn": "", "edad": "17", "sexo": "RM", "dx": "", "peso": "51", "talla": "1.65", "tto": "con"}, {"n": 45, "nom": "Huaman Ccusi Nataly", "hc": "204 416", "dni": "23523880", "fn": "", "edad": "14", "sexo": "RM", "dx": "", "peso": "57", "talla": "1.55", "tto": "con"}, {"n": 46, "nom": "Curi Candote Nora Rocio", "hc": "128 697", "dni": "42233036", "fn": "", "edad": "28", "sexo": "RM", "dx": "", "peso": "38", "talla": "1.605", "tto": "con"}, {"n": 47, "nom": "Reategui Fernandez Verius", "hc": "074 9356", "dni": "45653897", "fn": "", "edad": "31", "sexo": "RM", "dx": "", "peso": "61", "talla": "1.53", "tto": "con"}, {"n": 48, "nom": "Konokuentro Naniye Josue", "hc": "203 322", "dni": "7710328", "fn": "", "edad": "18", "sexo": "RM", "dx": "", "peso": "57", "talla": "1.5", "tto": "con"}, {"n": 49, "nom": "Soto Nato Jeany", "hc": "128 655", "dni": "10651820", "fn": "", "edad": "16", "sexo": "RM", "dx": "", "peso": "78", "talla": "1.783", "tto": "con"}, {"n": 50, "nom": "Fiestas Rosina Kathy", "hc": "442 622", "dni": "73259357", "fn": "", "edad": "44", "sexo": "RM", "dx": "", "peso": "71", "talla": "1.55", "tto": "con"}, {"n": 51, "nom": "Huamani Lozada Rosa", "hc": "123 716", "dni": "07102969", "fn": "", "edad": "24", "sexo": "RM", "dx": "", "peso": "61", "talla": "1.57", "tto": "con"}, {"n": 52, "nom": "Sotelo Newton Joshua", "hc": "133 936", "dni": "77733643", "fn": "", "edad": "14", "sexo": "RM", "dx": "", "peso": "46.7", "talla": "1.73", "tto": "con"}, {"n": 53, "nom": "Obregon Raymundo Fred", "hc": "201 154", "dni": "45724188", "fn": "", "edad": "34", "sexo": "RM", "dx": "", "peso": "73", "talla": "1.63", "tto": "con"}, {"n": 54, "nom": "Quispe Pasanen Yeyder", "hc": "1279", "dni": "3060", "fn": "", "edad": "11", "sexo": "RM", "dx": "", "peso": "13.2", "talla": "1.59", "tto": "con"}, {"n": 55, "nom": "Pichihua Ramos Yael", "hc": "222 180", "dni": "92099492", "fn": "", "edad": "5", "sexo": "RM", "dx": "", "peso": "", "talla": "", "tto": "con"}, {"n": 56, "nom": "Ramos Quiroz Zulema Flor", "hc": "222 179", "dni": "75582914", "fn": "", "edad": "26", "sexo": "RM", "dx": "", "peso": "", "talla": "", "tto": "con"}, {"n": 57, "nom": "Mamani Quispe Julio Martha", "hc": "606 990", "dni": "09315386", "fn": "", "edad": "72", "sexo": "RM", "dx": "", "peso": "", "talla": "", "tto": "con"}, {"n": 58, "nom": "Rivera Aliaga Jesus Mario", "hc": "2019 79", "dni": "80335543", "fn": "", "edad": "75", "sexo": "RM", "dx": "", "peso": "", "talla": "", "tto": "con"}, {"n": 59, "nom": "Torres Alarcon Jackelin Emilia", "hc": "7713 2217", "dni": "", "fn": "", "edad": "22", "sexo": "RM", "dx": "", "peso": "43", "talla": "1.47", "tto": "con"}, {"n": 60, "nom": "Donayre Criado Oscar", "hc": "219 832", "dni": "10361332", "fn": "", "edad": "59", "sexo": "RM", "dx": "", "peso": "66", "talla": "1.55", "tto": "con"}, {"n": 61, "nom": "Reynoso Meza Frida", "hc": "245 504", "dni": "10124130", "fn": "", "edad": "49", "sexo": "RM", "dx": "", "peso": "60", "talla": "1.42", "tto": "con"}, {"n": 62, "nom": "Berrospi Valderrama Lady Diana", "hc": "040 905", "dni": "31", "fn": "", "edad": "44", "sexo": "RM", "dx": "", "peso": "71", "talla": "1.63", "tto": "con"}, {"n": 63, "nom": "Espinoza Castillo Stefanny Betzabel", "hc": "218 429", "dni": "42979504", "fn": "", "edad": "23", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 64, "nom": "Aquino Portugal Violeta Yolanda", "hc": "220 337", "dni": "709916220", "fn": "", "edad": "-", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 65, "nom": "Tori Lorenzo Victor Gustavo", "hc": "220 643", "dni": "80514063", "fn": "", "edad": "-", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 66, "nom": "Escobar Quispe Maria", "hc": "210 646", "dni": "7725578", "fn": "", "edad": "-", "sexo": "F", "dx": "Extra-pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 67, "nom": "Delgado Criollo Martha", "hc": "220 720", "dni": "45089023", "fn": "", "edad": "41", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 68, "nom": "Torres Lopez Jackelin Yuli", "hc": "220 257", "dni": "61104250", "fn": "", "edad": "-", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 69, "nom": "Orellana Cardenas Luz Mery", "hc": "220 762", "dni": "62047298", "fn": "", "edad": "16", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 70, "nom": "Muñoz Cipriano Christoper Lee", "hc": "217 081", "dni": "77035791", "fn": "", "edad": "24", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 71, "nom": "Huaman Guizado Yomar Renzo", "hc": "218 853", "dni": "41335606", "fn": "", "edad": "48", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 72, "nom": "Torres Arias Jesus Jhonathan", "hc": "204 000", "dni": "40299844", "fn": "", "edad": "77", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 73, "nom": "Jesus Jhonathan", "hc": "217 920", "dni": "09572576", "fn": "", "edad": "-", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 74, "nom": "Machacuay Poma Jhessy Hermelinda", "hc": "220 927", "dni": "75979262", "fn": "", "edad": "-", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 75, "nom": "Neyra Lozano Segundo Yulian", "hc": "211 382", "dni": "08007298", "fn": "", "edad": "-", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 76, "nom": "Arias Yuto Gerson Max", "hc": "220 357", "dni": "77022900", "fn": "", "edad": "30", "sexo": "M", "dx": "Extra-pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 77, "nom": "Huaman Salcedo Juan Carlos", "hc": "220 491", "dni": "44060145", "fn": "", "edad": "38", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 78, "nom": "Velasquez Freyre Juan Gabriel", "hc": "220 500", "dni": "70898517", "fn": "", "edad": "-", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 79, "nom": "Vazquez Noa Mael Miguel", "hc": "221 440", "dni": "70632417", "fn": "", "edad": "19", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 80, "nom": "Cahuana Quinto Nancy Gaby", "hc": "207 209", "dni": "44253483", "fn": "", "edad": "38", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 81, "nom": "Pelicio Chinga Anderson Emerson", "hc": "221 265", "dni": "74839797", "fn": "", "edad": "19", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 82, "nom": "Montes Cárdenas Belfida Margarita", "hc": "221 266", "dni": "76258629", "fn": "", "edad": "25", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 83, "nom": "Valdivia Velasquez Jhoysi Rey", "hc": "217 654", "dni": "78106169", "fn": "", "edad": "22", "sexo": "F", "dx": "Extra-pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 84, "nom": "Borrero Luyo Bryan Daniel", "hc": "213 644", "dni": "48400234", "fn": "", "edad": "32", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 85, "nom": "Liman Benavides Angel", "hc": "221 381", "dni": "60971564", "fn": "", "edad": "19", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 86, "nom": "Sifuentes Gutierrez Santa Ines", "hc": "221 112", "dni": "70378616", "fn": "", "edad": "21", "sexo": "F", "dx": "Extra-pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 87, "nom": "Yzarra Vega Ronaldinho", "hc": "221 197", "dni": "60915077", "fn": "", "edad": "18", "sexo": "M", "dx": "Extra-pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 88, "nom": "Galindo Ramirez Carmen Wendy", "hc": "1437 75", "dni": "60049098", "fn": "", "edad": "19", "sexo": "F", "dx": "Extra-pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 89, "nom": "Cama Caruajulca Fredy", "hc": "221 495", "dni": "09756535", "fn": "", "edad": "54", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 90, "nom": "Meza Nina Flora Melissa", "hc": "221 328", "dni": "44704907", "fn": "", "edad": "38", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 91, "nom": "Torres Baltazar Jhony Saul", "hc": "221 837", "dni": "73331652", "fn": "", "edad": "21", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 92, "nom": "Bernal Barco Fredy Y.", "hc": "209 891", "dni": "40072522", "fn": "", "edad": "49", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 93, "nom": "Curi Lorenzo Victor", "hc": "220 607", "dni": "80894263", "fn": "", "edad": "47", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 94, "nom": "Soto Valenzuela Demetrio Rogelio", "hc": "133 635", "dni": "09194266", "fn": "", "edad": "65", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 95, "nom": "Quito Quispe Thomas", "hc": "129 509", "dni": "74918705", "fn": "", "edad": "24", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 96, "nom": "Sanchez Cortez Abraham", "hc": "127 501", "dni": "09978800", "fn": "", "edad": "52", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 97, "nom": "Silvestre Huarto Abraham", "hc": "216 912", "dni": "40653516", "fn": "", "edad": "36", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 98, "nom": "Noriega Felix Elza", "hc": "205 803", "dni": "09521866", "fn": "", "edad": "55", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 99, "nom": "Torres Alarcon Catherine Fiorella", "hc": "209 220", "dni": "77132217", "fn": "", "edad": "27", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 100, "nom": "Cespedes Ramos Emeterio", "hc": "206 534", "dni": "23746682", "fn": "", "edad": "55", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 101, "nom": "Eudoc Bemos P. Jhonatan Jhonny", "hc": "044 458", "dni": "74099603", "fn": "", "edad": "19", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 102, "nom": "Reynoso Meza Maximo", "hc": "222 299", "dni": "10660249", "fn": "", "edad": "49", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 103, "nom": "Melgar Rivera Yvan Carlos", "hc": "120 990", "dni": "80335543", "fn": "", "edad": "47", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 104, "nom": "Candelario Toribio de Velezmoro Jhon", "hc": "112 355", "dni": "09553390", "fn": "", "edad": "61", "sexo": "M", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 105, "nom": "Silder Pariona Azucena Marycielo", "hc": "222 571", "dni": "46207442", "fn": "", "edad": "34", "sexo": "F", "dx": "Pulmonar", "peso": "", "talla": "", "tto": "sensible"}, {"n": 106, "nom": "Mosquero Tineo Bryan Erick", "hc": "220 392", "dni": "61901845", "fn": "", "edad": "22", "sexo": "M", "dx": "R-H (Resistente)", "peso": "", "talla": "", "tto": "ECA MDR"}, {"n": 107, "nom": "Mosquero Tineo Brizena Jhazmy", "hc": "220 433", "dni": "71572593", "fn": "", "edad": "16", "sexo": "F", "dx": "R-H (Resistente)", "peso": "", "talla": "", "tto": "ECA BLC MDR"}, {"n": 108, "nom": "Acuña Paredes Victoria Yolanda", "hc": "112 597", "dni": "09946220", "fn": "", "edad": "41", "sexo": "F", "dx": "R", "peso": "", "talla": "", "tto": "Esquema A"}, {"n": 109, "nom": "Benites Linares Anibal Emily", "hc": "205 125", "dni": "60125870", "fn": "", "edad": "25", "sexo": "F", "dx": "R-H", "peso": "", "talla": "", "tto": "Esquema B MDR"}, {"n": 110, "nom": "Encalada Espinoza Jhon", "hc": "215 240", "dni": "76735959", "fn": "", "edad": "21", "sexo": "M", "dx": "R", "peso": "", "talla": "", "tto": "Esquema A MDR"}, {"n": 111, "nom": "Garcia Evangelista Sayuri", "hc": "126 060", "dni": "71647452", "fn": "", "edad": "26", "sexo": "F", "dx": "R-H", "peso": "", "talla": "", "tto": "ESQ. MODIF."}, {"n": 112, "nom": "Huancahuari Pacheco Ana Maria", "hc": "221 113", "dni": "45341304", "fn": "", "edad": "18", "sexo": "F", "dx": "R-H", "peso": "", "talla": "", "tto": "EDA MDR"}, {"n": 113, "nom": "Huaman Curi Michael Jhunior", "hc": "204 642", "dni": "77216255", "fn": "", "edad": "22", "sexo": "M", "dx": "R-H", "peso": "", "talla": "", "tto": "ECA MDR"}, {"n": 114, "nom": "Pavel Yuto Yerson Hardy", "hc": "119 557", "dni": "22232900", "fn": "", "edad": "24", "sexo": "M", "dx": "Resistente", "peso": "", "talla": "", "tto": "ESQ MODIF"}, {"n": 115, "nom": "Escobar Cárdenas Jhedi Abisail", "hc": "220 714", "dni": "91753108", "fn": "", "edad": "16", "sexo": "M", "dx": "Resistente", "peso": "", "talla": "", "tto": "ECA BLC MDR"}, {"n": 116, "nom": "Ccuno Cllueque Sabina", "hc": "207 395", "dni": "07565735", "fn": "", "edad": "47", "sexo": "F", "dx": "Resistente", "peso": "", "talla": "", "tto": "ESQ Modif"}, {"n": 117, "nom": "Curo Yace Jorge Ranulfo", "hc": "221 860", "dni": "07108150", "fn": "", "edad": "49", "sexo": "M", "dx": "Resistente", "peso": "", "talla": "", "tto": "ECA MDR"}, {"n": 118, "nom": "Noriega Felix Elsa Elvira", "hc": "203 803", "dni": "09521866", "fn": "", "edad": "55", "sexo": "F", "dx": "Resistente", "peso": "", "talla": "", "tto": "ESQ Modif"}, {"n": 119, "nom": "Isidro Esteban Yanguil", "hc": "222 166", "dni": "47987921", "fn": "", "edad": "32", "sexo": "M", "dx": "Resistente", "peso": "", "talla": "", "tto": "ECA MDR"}];
const COLS = ["n","nom","hc","dni","fn","edad","sexo","dx","peso","talla","tto"];
const HEADERS = ["N° Reg","APELLIDOS Y NOMBRES","HISTORIA CLINICA","DNI","FECHA DE NACIMIENTO","EDAD","SEXO","DIAGNOSTICO","PESO","TALLA","TRATAMIENTO"];
const OPC_SEXO = ["M","F","RM"];
const OPC_DX = ["Pulmonar","Extra-pulmonar","Resistente","R-H","R-H (Resistente)","R"];
const OPC_TTO = ["con","sensible","ECA MDR","ECA BLC MDR","ESQ Modif","Esquema A","Esquema B MDR"];
const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SET","OCT","NOV","DIC"];
const MESES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"];
const LS_PAC = "pct_pacientes_v1", LS_AT = "pct_atenciones_v1", LS_CFG = "pct_config_v1";
const BLOQUES_POR_PAGINA = 5;

let pacientes = [];
let atenciones = {};
let config = {estab:"C.S HUASCAR II",ups:"MEDICINA",resp:"MARI ALVA MAS",digit:"",lote:"",financia:"2",etnia:"58",distrito:""};
let pacActual = null;   // paciente elegido en ATENCIÓN
let atActual = null;    // id de la atención en edición

/* ======================= UTILIDADES ======================= */
function msg(t){const m=document.getElementById('msg');m.textContent=t;m.classList.add('show');clearTimeout(msg._t);msg._t=setTimeout(()=>m.classList.remove('show'),2200);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function num(v){if(v===""||v==null)return null;const n=parseFloat(String(v).replace(",","."));return isNaN(n)?null:n;}
function parseFecha(s){if(!s)return null;const m=String(s).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);if(!m)return null;let y=parseInt(m[3]);if(y<100)y+=y<30?2000:1900;const d=new Date(y,parseInt(m[2])-1,parseInt(m[1]));return isNaN(d)?null:d;}
function fmtFecha(d){return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();}
function hoy(){return fmtFecha(new Date());}
function calcEdad(fn){const d=parseFecha(fn);if(!d)return "";const h=new Date();let e=h.getFullYear()-d.getFullYear();const m=h.getMonth()-d.getMonth();if(m<0||(m===0&&h.getDate()<d.getDate()))e--;return e<0?"":String(e);}
function edadDe(r){return (r&&r.fn&&calcEdad(r.fn))||(r?String(r.edad||""):"");}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);}
function normTxt(s){return String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}
function resaltar(txt,q){const toks=normTxt(q).trim().split(/\s+/).filter(Boolean);let out="",i=0;const n=normTxt(txt);
  while(i<txt.length){let hit=null;for(const t of toks){if(n.startsWith(t,i)&&(!hit||t.length>hit.length))hit=t;}
    if(hit){out+="<mark>"+esc(txt.slice(i,i+hit.length))+"</mark>";i+=hit.length;}else{out+=esc(txt[i]);i++;}}
  return out;}
function nuevoRegistro(){return {id:uid(),n:"",nom:"",hc:"",dni:"",fn:"",edad:"",sexo:"",dx:"",peso:"",talla:"",tto:""};}
function normalizar(r){const o=nuevoRegistro();for(const k in o){if(r[k]!=null)o[k]=r[k];}o.id=String(o.id||uid());o.n=parseInt(o.n);if(isNaN(o.n))o.n="";o.dni=String(o.dni||"").replace(/\D/g,"");return o;}

/* ======================= PERSISTENCIA ======================= */
function cargar(){
  try{const p=JSON.parse(localStorage.getItem(LS_PAC));if(Array.isArray(p)&&p.length)pacientes=p.map(normalizar);}catch(e){}
  if(!pacientes.length)pacientes=DATA_INICIAL.map(normalizar);
  try{atenciones=JSON.parse(localStorage.getItem(LS_AT))||{};}catch(e){atenciones={};}
  try{config=Object.assign(config,JSON.parse(localStorage.getItem(LS_CFG))||{});}catch(e){}
}
function guardarPacientes(){try{localStorage.setItem(LS_PAC,JSON.stringify(pacientes));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync)Sync.programarPacientes();}
function guardarAtenciones(){try{localStorage.setItem(LS_AT,JSON.stringify(atenciones));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync)Sync.programarAtenciones();}
function guardarConfig(){try{localStorage.setItem(LS_CFG,JSON.stringify(config));}catch(e){}if(window.Sync)Sync.programarConfig();}


/* ======================= TABLA DATOS ======================= */
function contarAt(r){let c=0;for(const id in atenciones){const a=atenciones[id];if(a.pacId===r.id||(r.dni&&a.dni===r.dni))c++;}return c;}
function renderDatos(){
  const q=document.getElementById('search').value.trim().toLowerCase();
  const tb=document.getElementById('tbodyDatos');
  const rows=pacientes.map((r,i)=>({r,i})).filter(({r})=>{if(!q)return true;return normTxt([r.n,r.hc,r.dni,r.nom,r.sexo,r.dx,r.tto].join(" ")).includes(normTxt(q));});
  tb.innerHTML=rows.map(({r,i})=>`
  <tr data-i="${i}" data-id="${esc(r.id)}">
    <td class="num"><input class="w-num" data-k="n" value="${esc(r.n)}" style="text-align:center;font-weight:bold"></td>
    <td><input data-k="nom" value="${esc(r.nom)}"></td>
    <td><input data-k="hc" value="${esc(r.hc)}"></td>
    <td><input data-k="dni" value="${esc(r.dni)}" maxlength="8" inputmode="numeric" class="${r.dni&&r.dni.length!==8?'invalid':''}"></td>
    <td><span class="fn-wrap"><input data-k="fn" value="${esc(r.fn)}" placeholder="dd/mm/aaaa" class="${r.fn&&!parseFecha(r.fn)?'invalid':''}"><button type="button" class="cal-mini" tabindex="-1" title="Elegir fecha en el calendario (puede cambiar mes y año)">📅</button></span></td>
    <td><input data-k="edad" value="${esc(edadDe(r))}" style="text-align:center" ${r.fn&&parseFecha(r.fn)?'readonly class="auto" title="Calculada desde la fecha de nacimiento"':''}></td>
    <td><input data-k="sexo" value="${esc(r.sexo)}" class="mp" data-opc="sexo" style="text-align:center"></td>
    <td><input data-k="dx" value="${esc(r.dx)}" class="mp" data-opc="dx"></td>
    <td><input data-k="peso" value="${esc(r.peso)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="talla" value="${esc(r.talla)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="tto" value="${esc(r.tto)}" class="mp" data-opc="tto"></td>
    <td class="calc" style="text-align:center"><a href="#" onclick="irAtencion('${esc(r.id)}');return false" title="Ver atenciones HIS de este paciente">${contarAt(r)} · abrir</a></td>
    <td class="actions"><button title="Eliminar fila" onclick="delRow(${i})">✕</button></td>
  </tr>`).join("");
  document.getElementById('emptyMsg').style.display=rows.length?'none':'block';
  document.getElementById('countInfo').textContent=`${rows.length} de ${pacientes.length} registros`;
  tb.querySelectorAll('input.mp').forEach(el=>activarPredictivo(el,()=>opcionesDe(el.dataset.opc)));
}
function opcionesDe(k){const base=k==='sexo'?OPC_SEXO:k==='dx'?OPC_DX:OPC_TTO;const usados=[...new Set(pacientes.map(r=>String(r[k]||"").trim()).filter(Boolean))];return [...new Set(base.concat(usados))];}
document.getElementById('tbodyDatos').addEventListener('input',e=>{
  const el=e.target,tr=el.closest('tr');if(!tr||!el.dataset.k)return;
  const r=pacientes[+tr.dataset.i];let v=el.value;
  if(el.dataset.k==='dni'){v=v.replace(/\D/g,"").slice(0,8);el.value=v;el.classList.toggle('invalid',v.length>0&&v.length!==8);}
  if(el.dataset.k==='n'){const n=parseInt(v);v=isNaN(n)?"":n;}
  if(el.dataset.k==='fn'){el.classList.toggle('invalid',!!v&&!parseFecha(v));const ed=tr.querySelector('[data-k=edad]');if(parseFecha(v)){r.edad=calcEdad(v);ed.value=r.edad;ed.readOnly=true;ed.classList.add('auto');}else{ed.readOnly=false;ed.classList.remove('auto');}}
  r[el.dataset.k]=v;guardarPacientes();
});
// calendario para la fecha de nacimiento del padrón
(function(){const cal=document.getElementById('calTabla');let destino=null;
  document.getElementById('tbodyDatos').addEventListener('click',e=>{const b=e.target.closest('.cal-mini');if(!b)return;destino=b.parentElement.querySelector('input[data-k=fn]');
    const d=parseFecha(destino.value)||new Date(2010,0,1);cal.value=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    const r=b.getBoundingClientRect();cal.style.left=r.left+"px";cal.style.top=r.bottom+"px";try{cal.showPicker();}catch(x){cal.focus();cal.click();}});
  document.getElementById('tbodyDatos').addEventListener('dblclick',e=>{const i=e.target.closest('input[data-k=fn]');if(i)i.parentElement.querySelector('.cal-mini').click();});
  cal.addEventListener('change',()=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(cal.value);if(!m||!destino)return;destino.value=m[3]+"/"+m[2]+"/"+m[1];destino.dispatchEvent(new Event('input',{bubbles:true}));});
  document.getElementById('tbodyDatos').addEventListener('focusout',e=>{const i=e.target;if(i.dataset&&i.dataset.k==='fn'){const d=parseFecha(i.value);if(d){i.value=fmtFecha(d);i.dispatchEvent(new Event('input',{bubbles:true}));}}});
})();
function addRow(){
  const max=pacientes.reduce((m,r)=>Math.max(m,parseInt(r.n)||0),0);
  const r=nuevoRegistro();r.n=max+1;pacientes.push(r);guardarPacientes();
  document.getElementById('search').value="";renderDatos();
  const wrap=document.getElementById('datosWrap');wrap.scrollTop=wrap.scrollHeight;
  const last=document.querySelector('#tbodyDatos tr:last-child input[data-k=nom]');if(last)last.focus();
  msg("Fila N° "+r.n+" agregada");
}
function delRow(i){const r=pacientes[i];if(!confirm(`¿Eliminar la fila N° ${r.n} (${r.nom||'sin nombre'})?`))return;pacientes.splice(i,1);guardarPacientes();renderDatos();msg("Fila eliminada");}
function resetData(){if(!confirm("Se reemplazará el padrón actual por los datos originales del Excel. ¿Continuar?"))return;pacientes=DATA_INICIAL.map(normalizar);guardarPacientes();renderDatos();msg("Datos originales restaurados");}

/* ======================= IMPORTAR / EXPORTAR ======================= */
function parseCSV(text){
  text=text.replace(/^﻿/,"");const sep=(text.match(/;/g)||[]).length>(text.match(/,/g)||[]).length?";":",";
  const rows=[];let row=[],cell="",q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=c;}
    else if(c==='"')q=true;else if(c===sep){row.push(cell);cell="";}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell="";}
    else cell+=c;}
  if(cell!==""||row.length){row.push(cell);rows.push(row);}
  return rows.filter(r=>r.some(x=>String(x).trim()!==""));
}
function filasAPacientes(rows){
  if(!rows.length)return [];
  const norm=s=>normTxt(s).replace(/[^a-z0-9]/g,"");const hdr=rows[0].map(norm);
  const map={n:["nreg","n","no","num","numero","nro","nregistro"],nom:["apellidosynombres","nombres","nombre","paciente"],hc:["historiaclinica","hc","historia","nhistoria"],dni:["dni","documento","numerodedocumento"],fn:["fechadenacimiento","fechanacimiento","fnac","nacimiento"],edad:["edad"],sexo:["sexo","genero"],dx:["dx","diagnostico","diagnostico"],peso:["peso","pesokg"],talla:["talla","tallam"],tto:["tto","tratamiento","esquema"]};
  const idx={};let hits=0;for(const k in map){const j=hdr.findIndex(h=>map[k].includes(h));if(j>=0){idx[k]=j;hits++;}}
  let body=rows.slice(1);
  if(hits<4){body=rows;COLS.forEach((k,j)=>{idx[k]=j;});if(isNaN(parseInt(rows[0][0])))body=rows.slice(1);}
  // el Excel original trae SEXO y DX intercambiados: corregir si los valores lo delatan
  const out=[];
  for(const r of body){const o=nuevoRegistro();for(const k in idx){let v=r[idx[k]];if(v==null)v="";o[k]=String(v).trim();}
    if(/^(pulmonar|extra|resist|r-h|r)$/i.test(o.sexo)&&/^(m|f|rm)$/i.test(o.dx)){const t=o.sexo;o.sexo=o.dx;o.dx=t;}
    if(o.fn&&/^\d{4,5}$/.test(o.fn)){const d=new Date(Date.UTC(1899,11,30)+parseInt(o.fn)*86400000);o.fn=String(d.getUTCDate()).padStart(2,"0")+"/"+String(d.getUTCMonth()+1).padStart(2,"0")+"/"+d.getUTCFullYear();}
    if(o.n===""&&o.dni===""&&o.nom==="")continue;out.push(normalizar(o));}
  return out;
}
function importFile(inp){
  const f=inp.files[0];if(!f)return;inp.value="";
  const done=rows=>{const nuevos=filasAPacientes(rows);if(!nuevos.length){msg("No se encontraron registros válidos");return;}
    const modo=confirm(`Se leyeron ${nuevos.length} registros.\n\nAceptar = REEMPLAZAR el padrón actual\nCancelar = AGREGAR al padrón actual`);
    if(modo){pacientes=nuevos;}else{let max=pacientes.reduce((m,r)=>Math.max(m,parseInt(r.n)||0),0);nuevos.forEach(r=>{if(r.n===""||pacientes.some(p=>p.n===r.n))r.n=++max;else max=Math.max(max,r.n);pacientes.push(r);});}
    guardarPacientes();renderDatos();msg(`${nuevos.length} registros importados`);};
  if(/\.(xlsx|xls)$/i.test(f.name)){
    if(typeof XLSX==="undefined"){alert("No se pudo cargar la librería de Excel (sin conexión). Importe el archivo como CSV.");return;}
    const rd=new FileReader();rd.onload=e=>{const wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"});const name=wb.SheetNames.find(n=>/pacientes|datos/i.test(n))||wb.SheetNames[0];
      let rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:""});rows=rows.filter(r=>r.some(x=>String(x).trim()!==""));done(rows);};
    rd.readAsArrayBuffer(f);
  }else{const rd=new FileReader();rd.onload=e=>done(parseCSV(e.target.result));rd.readAsText(f,"UTF-8");}
}
function filaExport(r){return [r.n,r.nom,r.hc,r.dni,r.fn,edadDe(r),r.sexo,r.dx,r.peso,r.talla,r.tto];}
function descargar(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function exportCSV(){const q=v=>{v=String(v==null?"":v);return /[";\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  const lines=[HEADERS.map(q).join(";")].concat(pacientes.map(r=>filaExport(r).map(q).join(";")));
  descargar(new Blob(["﻿"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),"PCT_pacientes.csv");}
function exportXLSX(){
  if(typeof XLSX==="undefined"){alert("No se pudo cargar la librería de Excel (sin conexión). Use Exportar CSV.");return;}
  const aoa=[HEADERS].concat(pacientes.map(filaExport));const ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[7,34,14,12,14,6,6,18,8,8,16].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"PACIENTES");
  const ats=Object.values(atenciones).sort(ordenAt);
  if(ats.length){const ws2=XLSX.utils.aoa_to_sheet([CAB_AT].concat(ats.map(filaAt)));XLSX.utils.book_append_sheet(wb,ws2,"ATENCIONES");}
  XLSX.writeFile(wb,"PCT_pacientes.xlsx");}

/* ======================= MENÚ PREDICTIVO (lista flotante) ======================= */
const MP=document.createElement('div');MP.className='mp-lista no-print';document.body.appendChild(MP);
let mpInput=null,mpItems=[],mpSel=-1,mpSilencio=false,mpOnPick=null;
function mpMostrar(input,opciones,alElegir,render){
  if(mpSilencio)return;const q=input.value,toks=normTxt(q).trim().split(/\s+/).filter(Boolean);
  const lista=typeof opciones==='function'?opciones(q,toks):opciones;
  mpItems=lista;mpInput=input;mpSel=0;mpOnPick=alElegir||null;
  if(!mpItems.length){mpOcultar();return;}
  MP.innerHTML=mpItems.map((o,i)=>`<div class="mp-item${i?'':' act'}" data-i="${i}">${render?render(o,q):resaltar(String(o),q)}</div>`).join("");
  const r=input.getBoundingClientRect();MP.style.left=Math.min(r.left,window.innerWidth-Math.max(r.width,300)-8)+"px";MP.style.top=(r.bottom+3)+"px";MP.style.minWidth=Math.max(r.width,300)+"px";MP.style.display="block";
}
function mpOcultar(){MP.style.display="none";mpInput=null;}
function mpElegir(i){const el=mpInput,v=mpItems[i];if(!el||v==null)return;const fn=mpOnPick;mpOcultar();mpSilencio=true;try{if(fn)fn(v,el);else{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}}finally{mpSilencio=false;}}
MP.addEventListener('mousedown',e=>{const it=e.target.closest('.mp-item');if(it){e.preventDefault();mpElegir(+it.dataset.i);}});
function activarPredictivo(input,opciones,alElegir,render){
  if(input.dataset.mp)return;input.dataset.mp="1";
  const mostrar=()=>mpMostrar(input,opciones,alElegir,render);
  input.addEventListener('focus',mostrar);input.addEventListener('input',mostrar);
  input.addEventListener('blur',()=>setTimeout(()=>{if(mpInput===input)mpOcultar();},150));
  input.addEventListener('keydown',e=>{
    if(MP.style.display!=="block"||mpInput!==input)return;
    if(e.key==='ArrowDown'){e.preventDefault();mpSel=Math.min(mpItems.length-1,mpSel+1);}
    else if(e.key==='ArrowUp'){e.preventDefault();mpSel=Math.max(0,mpSel-1);}
    else if(e.key==='Enter'||e.key==='Tab'){if(e.key==='Enter')e.preventDefault();mpElegir(mpSel);return;}
    else if(e.key==='Escape'){mpOcultar();return;}
    else return;
    MP.querySelectorAll('.mp-item').forEach((el,i)=>el.classList.toggle('act',i===mpSel));
    const act=MP.querySelector('.mp-item.act');if(act)act.scrollIntoView({block:'nearest'});
  });
}
window.addEventListener('scroll',e=>{if(e.target!==mpInput)mpOcultar();},true);window.addEventListener('resize',mpOcultar);

/* ======================= CIE-10 (15 000 códigos, carga diferida) ======================= */
let CIE=null,CIE_N=null,cieCargando=null;
function cargarCIE(){if(CIE||cieCargando)return cieCargando;cieCargando=fetch('cie10.json').then(r=>r.json()).then(d=>{CIE=d;CIE_N=d.map(([c,t])=>normTxt(c+" "+t));return d;}).catch(()=>{cieCargando=null;msg("No se pudo cargar la lista CIE-10");return null;});return cieCargando;}
function codigosPropios(){return Array.isArray(config.codigos)?config.codigos.map(o=>({c:String(o.c||'').toUpperCase(),t:String(o.t||'').toUpperCase()})):[];}
function buscarCIE(q,toks){
  if(!toks.length)return [];const out=[];const cod=toks[0].toUpperCase();
  codigosPropios().forEach(o=>{if(toks.every(t=>normTxt(o.c+" "+o.t).includes(t)))out.push([o.c,o.t,true]);});
  if(CIE)for(let i=0;i<CIE.length&&out.length<40;i++){const s=CIE_N[i];if(toks.every(t=>s.includes(t))){out.push(CIE[i]);}}
  out.sort((a,b)=>{if(!!a[2]!==!!b[2])return a[2]?-1:1;const da=a[0].startsWith(cod),db=b[0].startsWith(cod);if(da!==db)return da?-1:1;return 0;});
  return out.slice(0,12);
}
function renderCIE(o,q){return `<span class="cie-cod">${resaltar(o[0],q)}</span><span class="cie-txt">${resaltar(o[1],q)}</span>${o[2]?'<span class="cie-propio">propio</span>':''}`;}
function pintarCodigos(){const li=document.getElementById('cpLista');const lst=codigosPropios();
  li.innerHTML=lst.length?lst.map((o,i)=>`<span class="cpchip"><b>${esc(o.c)}</b> ${esc(o.t)}<button type="button" title="Quitar" onclick="quitarCodigo(${i})">✕</button></span>`).join(""):'<span class="ficha-lbl">Aún no hay códigos propios.</span>';}
function agregarCodigo(){const c=document.getElementById('cpCod').value.trim().toUpperCase(),t=document.getElementById('cpTxt').value.trim().toUpperCase();
  if(!c||!t){alert("Escriba el código y su descripción.");return;}
  const lst=codigosPropios().filter(o=>o.c!==c);lst.push({c,t});config.codigos=lst;guardarConfig();pintarCodigos();
  document.getElementById('cpCod').value="";document.getElementById('cpTxt').value="";msg("Código "+c+" agregado");}
function quitarCodigo(i){const lst=codigosPropios();const o=lst[i];if(!o||!confirm(`¿Quitar el código ${o.c} · ${o.t}?`))return;lst.splice(i,1);config.codigos=lst;guardarConfig();pintarCodigos();}
function elegirCIE(v,el){const tr=el.closest('tr');const txt=tr.querySelector('input[data-f$="_txt"]'),cod=tr.querySelector('input[data-f$="_cie"]');
  txt.value=String(v[1]).toUpperCase();cod.value=v[0];guardarCelda(txt);guardarCelda(cod);}

/* ======================= REGISTRO HIS EDITABLE (como el Excel) ======================= */
const CAB_AT=["FECHA","TURNO","N° REG","APELLIDOS Y NOMBRES","DNI","HC","EDAD","SEXO","FINANCIA","DISTRITO","ETNIA","C. POBLADO","GESTANTE","PC","PAB","PESO","TALLA","HB","F. HB","F. REGLA","ESTABLEC","SERVICIO","DX1","TIPO1","LAB1","CIE1","DX2","TIPO2","LAB2","CIE2","DX3","TIPO3","LAB3","CIE3"];
function pacPorId(id){return pacientes.find(r=>r.id===id)||null;}
function pacPorN(n){n=parseInt(n);if(isNaN(n))return null;return pacientes.find(r=>parseInt(r.n)===n)||null;}
function ordenAt(a,b){return (a.dia||0)-(b.dia||0)||(parseInt(a.n)||0)-(parseInt(b.n)||0)||String(a.guardado||"").localeCompare(String(b.guardado||""));}
function tipoDe(a,n){return a[`dx${n}_p`]==="X"?"P":a[`dx${n}_d`]==="X"?"D":a[`dx${n}_r`]==="X"?"R":"";}
function ncrDe(a,p){return a[p+"_n"]==="X"?"N":a[p+"_c"]==="X"?"C":a[p+"_r"]==="X"?"R":"";}
function filaAt(a){const lab=n=>[a[`dx${n}_l1`],a[`dx${n}_l2`],a[`dx${n}_l3`]].filter(Boolean).join(" ");
  return [a.fecha,a.turno,a.n,a.nombre,a.dni,a.hc,a.edad,a.sexo,a.financia,a.distrito,a.etnia,a.cpoblado,a.gestante,a.pc,a.pab,a.peso,a.talla,a.hb,a.fechaHb,a.fechaRegla,ncrDe(a,'est'),ncrDe(a,'ser'),a.dx1_txt,tipoDe(a,1),lab(1),a.dx1_cie,a.dx2_txt,tipoDe(a,2),lab(2),a.dx2_cie,a.dx3_txt,tipoDe(a,3),lab(3),a.dx3_cie].map(v=>v==null?"":v);}
function irAtencion(id){const r=pacPorId(id);const ats=Object.values(atenciones).filter(a=>a.pacId===id).sort((x,y)=>String(x.guardado).localeCompare(String(y.guardado)));
  if(ats.length){const u=ats[ats.length-1];document.getElementById('regAnio').value=u.anio;document.getElementById('regMes').value=u.mes;llenarDias();document.getElementById('regDia').value="";}
  showView('registro');if(r)msg(`${ats.length} atención(es) de N° ${r.n}`);}
function pintarConfig(){for(const [id,k] of [['cfgEstab','estab'],['cfgUps','ups'],['cfgResp','resp'],['cfgDigit','digit'],['cfgLote','lote']]){const el=document.getElementById(id);if(document.activeElement!==el)el.value=config[k]||"";}}
document.querySelectorAll('.cfg').forEach(el=>el.addEventListener('input',()=>{const k={cfgEstab:'estab',cfgUps:'ups',cfgResp:'resp',cfgDigit:'digit',cfgLote:'lote'}[el.id];config[k]=el.value;guardarConfig();clearTimeout(pintarConfig._t);pintarConfig._t=setTimeout(()=>{const h=document.getElementById('hoja');h.querySelectorAll('.hdatos td:nth-child(3)').forEach(t=>t.textContent=config.estab||"");h.querySelectorAll('.hdatos td:nth-child(4)').forEach(t=>t.textContent=config.ups||"");h.querySelectorAll('.hdatos td:nth-child(5)').forEach(t=>t.textContent=config.resp||"");h.querySelectorAll('.cab-lote').forEach(t=>t.textContent="LOTE "+(config.lote||""));h.querySelectorAll('.cab-digit').forEach(t=>t.textContent="DIGITADOR "+(config.digit||""));},300);}));
(function(){const h=new Date();const ms=document.getElementById('regMes');ms.innerHTML=MESES_LARGO.map((m,i)=>`<option value="${i+1}">${m}</option>`).join("");ms.value=h.getMonth()+1;document.getElementById('regAnio').value=h.getFullYear();
  ['regAnio','regMes','regDia'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{if(id!=='regDia')llenarDias();renderRegistro();}));llenarDias();})();
function periodo(){return {a:+document.getElementById('regAnio').value,m:+document.getElementById('regMes').value,d:document.getElementById('regDia').value};}
function llenarDias(){const {a,m}=periodo(),sel=document.getElementById('regDia'),act=sel.value;const dias=new Set(Object.values(atenciones).filter(x=>x.anio===a&&x.mes===m).map(x=>x.dia));
  sel.innerHTML=`<option value="">Todos los días</option>`+[...dias].sort((x,y)=>x-y).map(d=>`<option value="${d}">${String(d).padStart(2,"0")}</option>`).join("");if([...dias].includes(+act))sel.value=act;}
function atencionesPeriodo(){const {a,m,d}=periodo();return Object.values(atenciones).filter(x=>x.anio===a&&x.mes===m&&(!d||x.dia===+d)).sort(ordenAt);}
function diaPorDefecto(){const {a,m,d}=periodo();if(d)return +d;const h=new Date();return (h.getFullYear()===a&&h.getMonth()+1===m)?h.getDate():"";}
function focoHoja(){const el=document.activeElement;const bl=el&&el.closest&&el.closest('.bloque');return bl?{id:bl.dataset.id,f:el.dataset.f,s:el.selectionStart}:null;}
function restaurarFocoHoja(f){if(!f||!f.id)return;const el=document.querySelector(`.bloque[data-id="${f.id}"] [data-f="${f.f}"]`);if(el){el.focus();try{el.setSelectionRange(f.s,f.s);}catch(e){}}}
function renderRegistro(){
  const lista=atencionesPeriodo(),{a,m}=periodo();
  document.getElementById('regInfo').textContent=`${lista.length} atención(es) · ${MESES_LARGO[m-1]} ${a}`;
  const bloques=lista.concat([null]); // siempre un bloque vacío al final para seguir registrando
  const paginas=[];for(let i=0;i<bloques.length;i+=BLOQUES_POR_PAGINA)paginas.push(bloques.slice(i,i+BLOQUES_POR_PAGINA));
  const f=focoHoja();
  document.getElementById('hoja').innerHTML=paginas.map((bl,pi)=>paginaHIS(bl,pi+1,paginas.length,a,m)).join("");
  activarHoja();restaurarFocoHoja(f);
}
function cab(v){return esc(v==null?"":v);}
function paginaHIS(bloques,np,total,anio,mes){
  const ini=(np-1)*BLOQUES_POR_PAGINA;const {d}=periodo();const fecha=d?String(d).padStart(2,"0")+"/"+String(mes).padStart(2,"0")+"/"+anio:"";
  const turnos=new Set(bloques.filter(Boolean).map(b=>b.turno));
  let h=`<div class="pagina"><table class="hcab"><colgroup><col style="width:22mm"><col style="width:135mm"><col style="width:35mm"><col style="width:25mm"><col style="width:55mm"></colgroup>
  <tr><td class="lbl cab-lote">LOTE ${cab(config.lote)}</td><td rowspan="4" class="tit"><img src="${LOGO_MINSA}" alt=""><div><b>MINISTERIO DE SALUD</b><br>OFICINA GENERAL DE ESTADÍSTICA E INFORMÁTICA<br><b class="grande">Registro Diario de Atención y Otras Actividades de Salud</b></div></td><td class="lbl c" colspan="3">FIRMA Y SELLO RESPONSABLE DEL HIS</td></tr>
  <tr><td class="lbl">&nbsp;</td><td rowspan="3" colspan="3" class="firma"></td></tr>
  <tr><td class="lbl">PÁGINA ${np} de ${total}</td></tr>
  <tr><td class="lbl">FECHA ${cab(fecha)}</td></tr>
  <tr><td class="lbl cab-digit">DIGITADOR ${cab(config.digit)}</td><td class="c small">TURNO: &nbsp; ${["M","T","N"].map(t=>t+" "+(turnos.has(t)?"☒":"☐")).join(" &nbsp; ")}</td><td colspan="3"></td></tr>
  </table>
  <table class="hdatos"><tr><th style="width:14mm">AÑO</th><th style="width:14mm">MES</th><th>NOMBRE DE ESTABLECIMIENTO DE SALUD (IPRESS)</th><th style="width:50mm">UNIDAD PRODUCTORA DE SALUD (UPS)</th><th style="width:70mm">NOMBRE DEL RESPONSABLE DE LA ATENCIÓN</th></tr>
  <tr><td class="c">${anio}</td><td class="c">${MESES[mes-1]}</td><td>${cab(config.estab)}</td><td>${cab(config.ups)}</td><td>${cab(config.resp)}</td></tr></table>
  <table class="hreg"><colgroup>${[7,9,22,11,22,9,5,8,9,11,11,11,9,9,62,5,5,5,7,7,7,16].map(w=>`<col style="width:${w}mm">`).join("")}</colgroup>
  <tr class="nums"><td></td><td>7</td><td>8</td><td>9</td><td>11</td><td colspan="2">13</td><td>14</td><td colspan="2">15</td><td colspan="2">16</td><td>17</td><td>18</td><td>19</td><td colspan="3">20</td><td colspan="3">21</td><td>22</td></tr>
  <tr class="th"><td rowspan="3">N°</td><td rowspan="3">DÍA</td><td>DNI</td><td>FINANCIA</td><td>DISTRITO DE PROCEDENCIA</td><td colspan="2" rowspan="3">EDAD</td><td rowspan="3">SEXO</td><td colspan="2" rowspan="3">PERÍMETRO CEFÁLICO Y ABDOMINAL</td><td colspan="2" rowspan="3">EVALUACIÓN ANTROPOMÉTRICA HEMOGLOBINA</td><td rowspan="3">ESTABLEC</td><td rowspan="3">SERVICIO</td><td rowspan="3">DIAGNÓSTICO MOTIVO DE CONSULTA Y/O ACTIVIDAD DE SALUD</td><td colspan="3" rowspan="2">TIPOS DE DIAGNÓSTICO</td><td colspan="3" rowspan="2">VALOR LAB</td><td rowspan="3">CÓDIGO</td></tr>
  <tr class="th"><td>HISTORIA CLÍNICA</td><td>10</td><td>12</td></tr>
  <tr class="th"><td>GESTANTE / PUÉRPERA</td><td>ETNIA</td><td>CENTRO POBLADO</td><td>P</td><td>D</td><td>R</td><td>1</td><td>2</td><td>3</td></tr>`;
  for(let i=0;i<bloques.length;i++)h+=bloqueHIS(bloques[i],ini+i+1);
  h+=`</table><div class="pie">Página ${np} de ${total}</div></div>`;return h;
}
function inp(a,f,cls,extra){return `<input class="hi ${cls||''}" data-f="${f}" value="${a?cab(a[f]):''}" ${extra||''}>`;}
function tog(a,f,letra,grupo){const on=a&&a[f]==="X";return `<span class="tg${on?' on':''}" data-f="${f}" data-g="${grupo}">${on?'X':letra}</span>`;}
function bloqueHIS(a,n){
  const id=a?a.id:"nuevo-"+n;const pac=a?(pacPorId(a.pacId)||{}):{};
  const fila=i=>`<td class="dx">${inp(a,`dx${i}_txt`,'dxtxt','autocomplete="off"')}</td><td class="c">${tog(a,`dx${i}_p`,'P','dx'+i)}</td><td class="c">${tog(a,`dx${i}_d`,'D','dx'+i)}</td><td class="c">${tog(a,`dx${i}_r`,'R','dx'+i)}</td><td class="c">${inp(a,`dx${i}_l1`,'c')}</td><td class="c">${inp(a,`dx${i}_l2`,'c')}</td><td class="c">${inp(a,`dx${i}_l3`,'c')}</td><td class="c cod">${inp(a,`dx${i}_cie`,'dxcod c b','autocomplete="off"')}</td>`;
  return `<tbody class="bloque" data-id="${id}" ${a?'':'data-nuevo="1"'}>
  <tr class="bn"><td class="c b"><input class="hi npac c b" data-f="npac" value="${a?cab(a.n):''}" autocomplete="off" title="N° Reg del paciente (o escriba nombre / DNI)"></td><td colspan="2" class="lbl">NOMBRE DEL PACIENTE:</td><td colspan="18" class="nom" data-auto="nombre">${a?cab(a.nombre):''}</td><td class="c no-print"><button type="button" class="quitar" title="Quitar esta atención" ${a?'':'disabled'}>✕</button></td></tr>
  <tr class="bf"><td></td><td colspan="2" class="lbl">FECHA DE NACIMIENTO</td><td colspan="4" data-auto="fn">${cab(pac.fn)}</td><td colspan="3" class="lbl">FECHA DE HB</td><td colspan="4">${inp(a,'fechaHb','','placeholder=""')}</td><td class="lbl">FECHA DE REGLA</td><td colspan="7">${inp(a,'fechaRegla')}</td></tr>
  <tr class="b1"><td></td><td rowspan="3" class="c">${inp(a,'dia','c b','inputmode="numeric" maxlength="2"')}</td><td class="c" data-auto="dni">${a?cab(a.dni):''}</td><td rowspan="2" class="c">${inp(a,'financia','c')}</td><td rowspan="2">${inp(a,'distrito')}</td><td rowspan="3" class="c b" data-auto="edad">${a?cab(a.edad):''}</td><td class="c">${tog(a,'edad_a','A','edad')}</td><td rowspan="3" class="c" data-auto="sexo">${a?cab(a.sexo):''}</td><td class="lbl">PC</td><td class="c">${inp(a,'pc','c')}</td><td class="lbl">PESO</td><td class="c">${inp(a,'peso','c')}</td><td class="c">${tog(a,'est_n','N','est')}</td><td class="c">${tog(a,'ser_n','N','ser')}</td>${fila(1)}</tr>
  <tr class="b2"><td></td><td class="c" data-auto="hc">${a?cab(a.hc):''}</td><td class="c">${tog(a,'edad_m','M','edad')}</td><td class="lbl">PAB</td><td class="c">${inp(a,'pab','c')}</td><td class="lbl">TALLA</td><td class="c">${inp(a,'talla','c')}</td><td class="c">${tog(a,'est_c','C','est')}</td><td class="c">${tog(a,'ser_c','C','ser')}</td>${fila(2)}</tr>
  <tr class="b3"><td></td><td class="c">${inp(a,'gestante','c','maxlength="1"')}</td><td class="c">${inp(a,'etnia','c')}</td><td>${inp(a,'cpoblado')}</td><td class="c">${tog(a,'edad_d','D','edad')}</td><td colspan="2"></td><td class="lbl">HB</td><td class="c">${inp(a,'hb','c')}</td><td class="c">${tog(a,'est_r','R','est')}</td><td class="c">${tog(a,'ser_r','R','ser')}</td>${fila(3)}</tr>
  </tbody>`;
}
function defaultsAt(){const ult=Object.values(atenciones).sort((x,y)=>String(x.guardado||"").localeCompare(String(y.guardado||""))).pop()||{};
  return {turno:document.getElementById('regTurno').value,financia:config.financia||"2",distrito:ult.distrito||config.distrito||"",etnia:config.etnia||"58",cpoblado:ult.cpoblado||"",edad_a:"X",est_c:"X",ser_c:"X"};}
function crearAtencion(bloque,pac){
  const {a,m}=periodo();const dia=parseInt(bloque.querySelector('[data-f=dia]').value)||diaPorDefecto()||1;
  const id=uid();const rec=Object.assign({},defaultsAt(),{id,pacId:pac.id,n:pac.n,nombre:pac.nom,dni:pac.dni,hc:pac.hc,sexo:pac.sexo,edad:edadDe(pac),peso:pac.peso||"",talla:pac.talla||"",anio:a,mes:m,dia,fecha:String(dia).padStart(2,"0")+"/"+String(m).padStart(2,"0")+"/"+a,guardado:new Date().toISOString()});
  // conservar lo ya escrito en el bloque vacío
  bloque.querySelectorAll('input.hi').forEach(i=>{if(i.dataset.f!=='npac'&&i.dataset.f!=='dia'&&i.value.trim())rec[i.dataset.f]=i.value;});
  bloque.querySelectorAll('.tg.on').forEach(t=>rec[t.dataset.f]="X");
  atenciones[id]=rec;guardarAtenciones();return rec;
}
function asignarPaciente(bloque,pac){
  let id=bloque.dataset.id,rec=atenciones[id];
  if(!rec){rec=crearAtencion(bloque,pac);bloque.dataset.id=rec.id;bloque.removeAttribute('data-nuevo');bloque.querySelector('.quitar').disabled=false;}
  else{Object.assign(rec,{pacId:pac.id,n:pac.n,nombre:pac.nom,dni:pac.dni,hc:pac.hc,sexo:pac.sexo,edad:edadDe(pac)});if(!rec.peso)rec.peso=pac.peso||"";if(!rec.talla)rec.talla=pac.talla||"";guardarAtenciones();}
  // llenar celdas automáticas y valores por defecto (como las fórmulas del Excel)
  bloque.querySelector('[data-f=npac]').value=pac.n;
  bloque.querySelector('[data-auto=nombre]').textContent=pac.nom||"";bloque.querySelector('[data-auto=fn]').textContent=pac.fn||"";
  bloque.querySelector('[data-auto=dni]').textContent=pac.dni||"";bloque.querySelector('[data-auto=hc]').textContent=pac.hc||"";
  bloque.querySelector('[data-auto=edad]').textContent=edadDe(pac);bloque.querySelector('[data-auto=sexo]').textContent=pac.sexo||"";
  bloque.querySelectorAll('input.hi').forEach(i=>{const k=i.dataset.f;if(k==='npac')return;if(rec[k]!=null&&i.value!==String(rec[k]))i.value=rec[k];});
  bloque.querySelectorAll('.tg').forEach(t=>{const on=rec[t.dataset.f]==="X";t.classList.toggle('on',on);t.textContent=on?'X':t.dataset.f.split('_')[1].toUpperCase();});
  document.getElementById('savedTag').textContent="✔ Guardado";
  llenarDias();document.getElementById('regInfo').textContent=`${atencionesPeriodo().length} atención(es) · ${MESES_LARGO[periodo().m-1]} ${periodo().a}`;
  if(!document.querySelector('.bloque[data-nuevo]')){clearTimeout(asignarPaciente._t);asignarPaciente._t=setTimeout(renderRegistro,0);}
}
function guardarCelda(el){
  const bloque=el.closest('.bloque');if(!bloque)return;const rec=atenciones[bloque.dataset.id];if(!rec)return;
  const k=el.dataset.f;let v=el.classList.contains('tg')?(el.classList.contains('on')?"X":""):el.value;
  if(k==='dia'){const d=parseInt(v);if(!isNaN(d)&&d>=1&&d<=31){rec.dia=d;rec.fecha=String(d).padStart(2,"0")+"/"+String(rec.mes).padStart(2,"0")+"/"+rec.anio;}}
  else rec[k]=v;
  if(k==='peso'||k==='talla'){const p=pacPorId(rec.pacId);if(p&&v){p[k]=v;guardarPacientes();}}
  rec.guardado=new Date().toISOString();guardarAtenciones();document.getElementById('savedTag').textContent="✔ Guardado";
}
function sugerirPaciente(q,toks){if(!toks.length)return [];const qn=q.trim(),num=/^\d+$/.test(qn);
  const rank=r=>{const n=String(r.n);if(num){if(n===qn)return 0;if(n.startsWith(qn))return 1;if(String(r.dni||"").startsWith(qn)||String(r.hc||"").replace(/\s/g,"").startsWith(qn))return 2;return 9;}
    const s=normTxt([r.n,r.dni,r.hc,r.nom].join(" "));return toks.every(t=>s.includes(t))?3:9;};
  return pacientes.map(r=>[rank(r),r]).filter(x=>x[0]<9).sort((x,y)=>x[0]-y[0]||(parseInt(x[1].n)||0)-(parseInt(y[1].n)||0)).slice(0,8).map(x=>x[1]);}
function renderPac(r,q){return `<span class="cie-cod">N° ${resaltar(String(r.n),q)}</span><span class="cie-txt">${resaltar(r.nom||"(sin nombre)",q)} · DNI ${resaltar(r.dni||"—",q)}</span>`;}
function activarHoja(){
  const hoja=document.getElementById('hoja');
  hoja.querySelectorAll('input.npac').forEach(el=>activarPredictivo(el,sugerirPaciente,(r,inp)=>asignarPaciente(inp.closest('.bloque'),r),renderPac));
  hoja.querySelectorAll('input.dxtxt').forEach(el=>{el.addEventListener('focus',cargarCIE,{once:true});activarPredictivo(el,(q,toks)=>buscarCIE(q,toks),elegirCIE,renderCIE);});
  hoja.querySelectorAll('input.dxcod').forEach(el=>{el.addEventListener('focus',cargarCIE,{once:true});activarPredictivo(el,(q,toks)=>buscarCIE(q,toks),elegirCIE,renderCIE);});
}
document.getElementById('hoja').addEventListener('change',e=>{const el=e.target;if(!el.classList.contains('hi'))return;
  if(el.dataset.f==='npac'){const p=pacPorN(el.value);if(p)asignarPaciente(el.closest('.bloque'),p);else if(el.value.trim()&&!atenciones[el.closest('.bloque').dataset.id]){msg("No existe un paciente con N° "+el.value);}return;}
  const bl=el.closest('.bloque');if(!atenciones[bl.dataset.id]){if(el.value.trim())msg("Primero escriba el N° del paciente en este bloque");return;}
  if(/^(fechaHb|fechaRegla)$/.test(el.dataset.f)){const d=parseFecha(el.value);if(d)el.value=fmtFecha(d);}
  guardarCelda(el);});
document.getElementById('hoja').addEventListener('input',e=>{const el=e.target;if(!el.classList.contains('hi')||el.dataset.f==='npac')return;const bl=el.closest('.bloque');if(atenciones[bl.dataset.id]){document.getElementById('savedTag').textContent="";clearTimeout(el._t);el._t=setTimeout(()=>guardarCelda(el),500);}});
document.getElementById('hoja').addEventListener('click',e=>{
  const q=e.target.closest('.quitar');if(q){const bl=q.closest('.bloque'),rec=atenciones[bl.dataset.id];if(!rec)return;if(!confirm(`¿Quitar la atención de N° ${rec.n} · ${rec.nombre}?`))return;delete atenciones[bl.dataset.id];guardarAtenciones();renderRegistro();msg("Atención quitada");return;}
  const t=e.target.closest('.tg');if(!t)return;const bl=t.closest('.bloque');if(!atenciones[bl.dataset.id]){msg("Primero escriba el N° del paciente en este bloque");return;}
  const on=!t.classList.contains('on');
  bl.querySelectorAll(`.tg[data-g="${t.dataset.g}"]`).forEach(x=>{const xon=x===t?on:false;x.classList.toggle('on',xon);x.textContent=xon?'X':x.dataset.f.split('_')[1].toUpperCase();guardarCelda(x);});
});
document.getElementById('regTurno').addEventListener('change',()=>{});
window.alCambiarPacientes=()=>{if(document.getElementById('registro').classList.contains('active'))renderRegistro();};
window.alCambiarAtenciones=()=>{if(document.getElementById('registro').classList.contains('active')){llenarDias();renderRegistro();}if(document.getElementById('datos').classList.contains('active'))renderDatos();};
window.alCambiarConfig=()=>{pintarConfig();pintarCodigos();if(document.getElementById('registro').classList.contains('active'))renderRegistro();};
function exportRegistroXLSX(){if(typeof XLSX==="undefined"){alert("No se pudo cargar la librería de Excel (sin conexión).");return;}
  const lista=atencionesPeriodo();if(!lista.length){msg("No hay atenciones en el periodo");return;}
  const {a,m}=periodo();const ws=XLSX.utils.aoa_to_sheet([CAB_AT].concat(lista.map(filaAt)));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"HIS "+MESES[m-1]+" "+a);XLSX.writeFile(wb,`PCT_HIS_${a}_${String(m).padStart(2,"0")}.xlsx`);}

/* ======================= INICIO ======================= */
function showView(v){
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===v));
  document.getElementById('tabDatos').classList.toggle('active',v==='datos');
  document.getElementById('tabRegistro').classList.toggle('active',v==='registro');
  if(v==='registro'){llenarDias();renderRegistro();}
}
cargar();renderDatos();pintarConfig();pintarCodigos();
