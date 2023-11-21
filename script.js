const MARGIN = {
    top: 40,
    left: 90,
    right: 90,
    bottom: 40,
};

const MARGIN2 = {
  top: 50,
  left: 90,
  right: 90,
  bottom: 50,
};

const WIDTH = document.getElementsByTagName('body')[0].clientWidth/1.5;
const HEIGHT = (WIDTH/2) - MARGIN.top - MARGIN.bottom;

const WIDTH2 = document.getElementsByTagName('body')[0].clientWidth / 2;
const HEIGHT2 = document.getElementsByTagName('body')[0].clientWidth / 4;



// http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
d3.selection.prototype.moveToBack = function() {  
  return this.each(function() { 
    var firstChild = this.parentNode.firstChild; 
    if (firstChild) { 
      this.parentNode.insertBefore(this, firstChild); 
    } 
  });
};


const proyeccion = d3.geoMercator();



let tableDiv;
let divs;
let counter;
function buildMoviesList(pais, service) {

    let peliculas_pais_service = [{"table": "Table1", "rows": []}]
    d3.json("./data/paisesPeliculas.json").then((datosCargados) => {
        d3.selectAll("td.pelicula_dato").remove()
        d3.selectAll("th.pelicula_row").remove()
        counter = 0;
        for (p of datosCargados[pais]) {
            if (p[service] == "1") {
                p["code"] = `movie-${counter}-${pais}`;
                peliculas_pais_service[0]["rows"].push( {"Título": p["Title"], "Año": p["Year"], "Puntaje": p["Rotten Tomatoes"] });
                counter += 1;
                console.log(p)
            };
        };

        for (row of peliculas_pais_service[0].rows) {
            const tr = d3.select("table#peliculas").append("tr").attr("class", "pelicula_row");
            tr.append("td").attr("class", "pelicula_dato").text(row["Título"])
            tr.append("td").attr("class", "pelicula_dato").text(row["Año"])
            tr.append("td").attr("class", "pelicula_dato").text(row["Puntaje"])            
        }

        d3.select("div.visible-div").style("display", "block").style("margin", "auto");
        d3.select("h4.movies-name").text(`peliculas de ${pais} en ${service}`).style("margin-top", "50px").style("color", "black");


    });
};

let cntry;
function buildGraf(pais, stats_paises) {
    let stats_pais;
    let peliculas_pais;
    if (pais == "None") {
        stats_pais = {"qNetflix": 0, "qPrime": 0, "qHulu": 0, "qDisney": 0};
    } else {
        stats_pais = stats_paises[pais];
    }

    let datos_pais = [
        {"code": "Netflix", "servicio": "Netflix" , "cantidad": stats_pais.qNetflix, "color": 'rgb(229, 9, 20)'},
        {"code": "Prime", "servicio": "Prime Video", "cantidad": stats_pais.qPrime, "color": 'rgb(0, 168, 225)'},
        {"code": "Hulu", "servicio": "Hulu", "cantidad": stats_pais.qHulu, "color": '#3dbb3d'},
        {"code": "Disney", "servicio": "Disney+", "cantidad": stats_pais.qDisney, "color": '#12194A'},
    ]
    
    let max_dom = 10;
    let max_q = d3.max([stats_pais.qNetflix, stats_pais.qPrime, stats_pais.qHulu, stats_pais.qDisney]);
    
    if (max_q > max_dom) {
        max_dom = max_q;
    }

    const escalaAltura = d3
        .scaleLinear()
        .domain([0, max_dom])
        .range([0, HEIGHT2 - MARGIN2.top - MARGIN2.bottom]);
    
    const escalaY = d3
        .scaleLinear()
        .domain([0, max_dom])
        .range([HEIGHT2 - MARGIN2.top - MARGIN2.bottom, 0]);

    const ejeY = d3.axisLeft(escalaY);

    contenedorEjeY
        .transition()
        .duration(1000)
        .call(ejeY)
        .selection()
        .selectAll("line")
        .attr("x1", WIDTH2*0.8)
        .attr("stroke-dasharray", "5")
        .attr("opacity", 0.5);
    
    const escalaX = d3
        .scaleBand()
        .domain(datos_pais.map((d) => d.servicio))
        .rangeRound([0, WIDTH2*0.8])
        .padding(0.5);

    const ejeX = d3.axisBottom(escalaX);

    contenedorEjeX
        .transition()
        .duration(1000)
        .call(ejeX)
        .selection()
        .selectAll("text")
        .attr("font-size", 12);
    
    const update = contenedorBarras
        .selectAll("rect")
        .data(datos_pais, (d) => d.servicio);

    cntry = pais;
    contenedorBarras
        .selectAll("rect")
        .data(datos_pais, (d) => d.servicio)
        .join(
            (enter) => {
                enter
                .append("rect")
                .attr("fill", (d) => d.color)
                .attr("y", HEIGHT2 - MARGIN2.top - MARGIN2.bottom)
                .attr("x", (d) => escalaX(d.servicio))
                .attr("width", escalaX.bandwidth())
                .attr("height", 0)
                .transition()
                .duration(1500)
                .attr("height", (d) => escalaAltura(d.cantidad))
                .attr("y", (d) => escalaY(d.cantidad))
                .selection()
                .on("mouseover", function(d) {
                    d3.select(this).style("opacity", 0.6)
                })
                .on("mouseout", function(d) {
                    d3.select(this).style("opacity", 1)
                })
                .on("click", (_, d) => buildMoviesList(cntry, d.servicio));
            },
            (update) =>
                update
                .transition()
                .duration(1500)
                .attr("height", (d) => escalaAltura(d.cantidad))
                .attr("y", (d) => escalaY(d.cantidad))
                .attr("x", (d) => escalaX(d.servicio))
                .attr("width", escalaX.bandwidth())
                .selection(),
            (exit) =>
                exit
                .transition()
                .duration(2000)
                .attr("y", HEIGHT2 - MARGIN2.top - MARGIN2.bottom)
                .attr("height", 0)
                .remove()
        )
};

function visualizer(Service) {
    let cant_movies;
    let svg = d3.select("body")
                .select(`div.map-container#${Service}`)
                .append("svg")
                .attr("width", WIDTH)
                .attr("height", HEIGHT)
                .attr("class", "map");

    let map_svg = svg.append("g")
                    .attr("class", "map");

    let boundingRect = map_svg.append("rect")
        .attr("id", "boudaries")
        .attr("width", "100%")
        .attr("height", HEIGHT)
        .attr("fill", "lightgray")
        .attr("stroke", "black")
        .selection()
        .moveToBack();

    let clipPath = map_svg.append("clipPath")
                        .attr("id", "mapClip")
                        .append("rect")
                            .attr("width", WIDTH)
                            .attr("height", HEIGHT);

    map_svg.attr("clip-path", "url(#mapClip)")

    let zoomHandler = (evento) => {
        let transformacion = evento.transform;
        map_svg.selectAll("path")
                .attr("transform", transformacion);
    }

    let zoom = d3.zoom()
                    .extent([ [0, 0], [WIDTH, HEIGHT], ])
                    .translateExtent([ [0, 0], [WIDTH, HEIGHT], ])
                    .scaleExtent([1, 8])
                    .on("zoom", zoomHandler);

    svg.call(zoom);

    // Tooltip. Fuente: https://bl.ocks.org/d3noob/97e51c5be17291f79a27705cef827da2
    let div_map = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    if (Service != "None") {

        d3.json("./data/countriesStats.json").then((datos) => {
            let coloresService = datos["colors"];
            let countriesStats = datos["countries"];

            let coloresDatos = coloresService[Service];
            let rangos = coloresDatos["ranges"];
            let colores = coloresDatos["colors"];
            
            proyeccion.fitSize([WIDTH, HEIGHT*1.2], countriesStats)
            let caminosGeo = d3.geoPath().projection(proyeccion);

            let max_q = 0;
            let max_q_2 = 0
            let stats_paises = {};
            for (dato of countriesStats.features) {
                statsPaises[dato.properties.ADMIN] = dato.stats
                if (dato.stats[`q${Service}`] > max_q) {
                    max_q = dato.stats[`q${Service}`]
                } else if (dato.stats[`q${Service}`]<max_q && dato.stats[`q${Service}`]>max_q_2) {
                    max_q_2 = dato.stats[`q${Service}`]
                };
            };
            
            // 1) MAPA X CANTIDAD DE PELÍCULAS
            let escalaColor = (peliculas) => {
                if (peliculas > rangos[0]) {
                    return colores[0];
                } else if (peliculas <= rangos[0] && peliculas > rangos[1]) {
                    return colores[1];
                } else if (peliculas <= rangos[1] && peliculas > rangos[2]) {
                    return colores[2];
                } else if (peliculas <= rangos[2] && peliculas > rangos[3]) {
                    return colores[3];
                } else if (peliculas <= rangos[3] && peliculas > rangos[4]) {
                    return colores[4];
                } else if (peliculas <= rangos[4] && peliculas > 0) {
                    return colores[5];
                } else {
                    return "gray";
                }
            };

            // LEYENDAS
            // 1.
            let color_data_1 = d3.select(`div.data-container#${Service}`)
            .append("div")
            .attr("class", "horizontal-flex-container")
            .style("display", "flex")
            .style("height", "25px");

            color_data_1.append("div").style("flex", 1)
            .append("svg")
            .attr("width", "25px")
            .attr("height", "25px")
            .append("rect")
            .attr("width", "25px")
            .attr("height", "25px")
            .attr("fill", colores[0])
            .attr("stroke", "black");

            color_data_1.append("div").style("flex", 11)
            .append("h5").style("color", "black").text(` +${rangos[0]}`).style("margin", 0)

            // 2.
            let color_data_2 = d3.select(`div.data-container#${Service}`)
                .append("div").attr("id", "ntf_uno")
                .attr("class", "horizontal-flex-container")
                .style("display", "flex")
                .style("height", "25px")
                .style("margin-top", "10px");

            color_data_2.append("div").style("flex", 1)
            .append("svg")
            .attr("width", "25px")
            .attr("height", "25px")
            .append("rect")
            .attr("width", "25px")
            .attr("height", "25px")
            .attr("fill", colores[1])
            .attr("stroke", "black");

            color_data_2.append("div").style("flex", 11)
            .append("h5").style("color", "black").text(` ${rangos[1]}-${rangos[0]}`).style("margin", 0)

            // 3.
            let color_data_3 = d3.select(`div.data-container#${Service}`)
                .append("div").attr("id", "ntf_uno")
                .attr("class", "horizontal-flex-container")
                .style("display", "flex")
                .style("height", "25px")
                .style("margin-top", "10px");

            color_data_3.append("div").style("flex", 1)
            .append("svg")
            .attr("width", "25px")
            .attr("height", "25px")
            .append("rect")
            .attr("width", "25px")
            .attr("height", "25px")
            .attr("fill", colores[2])
            .attr("stroke", "black");

            color_data_3.append("div").style("flex", 11)
            .append("h5").style("color", "black").text(` ${rangos[2]}-${rangos[1]}`).style("margin", 0)

            //4.
            let color_data_4 = d3.select(`div.data-container#${Service}`)
                .append("div").attr("id", "ntf_uno")
                .attr("class", "horizontal-flex-container")
                .style("display", "flex")
                .style("height", "25px")
                .style("margin-top", "10px");

            color_data_4.append("div").style("flex", 1)
            .append("svg")
            .attr("width", "25px")
            .attr("height", "25px")
            .append("rect")
            .attr("width", "25px")
            .attr("height", "25px")
            .attr("fill", colores[3])
            .attr("stroke", "black");

            color_data_4.append("div").style("flex", 11)
            .append("h5").style("color", "black").text(` ${rangos[3]}-${rangos[2]}`).style("margin", 0)

            // 5.
            let color_data_5 = d3.select(`div.data-container#${Service}`)
                .append("div").attr("id", "ntf_uno")
                .attr("class", "horizontal-flex-container")
                .style("display", "flex")
                .style("height", "25px")
                .style("margin-top", "10px");

            color_data_5.append("div").style("flex", 1)
            .append("svg")
            .attr("width", "25px")
            .attr("height", "25px")
            .append("rect")
            .attr("width", "25px")
            .attr("height", "25px")
            .attr("fill", colores[4])
            .attr("stroke", "black");

            color_data_5.append("div").style("flex", 11)
            .append("h5").style("color", "black").text(` ${rangos[4]}-${rangos[3]}`).style("margin", 0)

            // 6.
            let color_data_6 = d3.select(`div.data-container#${Service}`)
                .append("div").attr("id", "ntf_uno")
                .attr("class", "horizontal-flex-container")
                .style("display", "flex")
                .style("height", "25px")
                .style("margin-top", "10px");

            color_data_6.append("div").style("flex", 1)
            .append("svg")
            .attr("width", "25px")
            .attr("height", "25px")
            .append("rect")
            .attr("width", "25px")
            .attr("height", "25px")
            .attr("fill", colores[5])
            .attr("stroke", "black");

            color_data_6.append("div").style("flex", 11)
            .append("h5").style("color", "black").text(` 1-${rangos[4]}`).style("margin", 0)

            // 7.
            let color_data_8 = d3.select(`div.data-container#${Service}`)
                .append("div").attr("id", "ntf_uno")
                .attr("class", "horizontal-flex-container")
                .style("display", "flex")
                .style("height", "25px")
                .style("margin-top", "10px");

            color_data_8.append("div").style("flex", 1)
            .append("svg")
            .attr("width", "25px")
            .attr("height", "25px")
            .append("rect")
            .attr("width", "25px")
            .attr("height", "25px")
            .attr("fill", "gray")
            .attr("stroke", "black");

            color_data_8.append("div").style("flex", 11)
            .append("h5").style("color", "black").text(" 0").style("margin", 0)


            map_svg
                .selectAll("path")
                .data(countriesStats.features)
                .enter()
                .append("path")
                .attr("id", (f) => f.properties.ISO_A3)
                .attr("d", caminosGeo)
                .attr("fill", (f) => escalaColor(f.stats[`q${Service}`]))
                .attr("stroke", "black")
                .attr("stroke-width", 0.2)
                .on("mouseover", function(event,d) {
                    if (d.properties.ADMIN.length > 12) {
                        div_map.style("width", "150px");
                    } else {
                        div_map.style("width", "70px");
                    };
                    div_map.transition()
                        .duration(200)
                        .style("opacity", .9);
                    if (d.stats[`q${Service}`]) {
                        cant_movies = d.stats[`q${Service}`];
                    } else {
                        cant_movies = 0
                    }
                    div_map.html(d.properties.ADMIN + "<br/>" + "<b>" + cant_movies + "</b>")
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");            
                })
                .on("mouseout", function(d) {
                    div_map.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .on("click", handleClickPais);
            
            boundingRect.on("click", handleClickMar)
            let clicked = false;
            
            function handleClickMar(_, d) {
                d3.select("div.visible-div").style("display", "none");
                clicked = false;
                for (p of countriesStats.features) {
                    svg.select(`path#${p.properties.ISO_A3}`).attr("stroke", "black").attr("stroke-width", 0.2).attr("opacity", 1);
                };

                div_map.transition()
                            .duration(500)
                            .style("opacity", 0);
                
                buildGraf("None", statsPaises);
                d3.select("h2.country-name").text("seleccione un país para ver su cantidad de películas en cada plataforma").style("color", "dimgray");
                d3.select("h4.movies-name").text("");
            };

            function handleClickPais(event, d) {
                d3.select("div.visible-div").style("display", "none");
                if (d.stats[`q${Service}`] != null && d.stats[`q${Service}`] != 0) {
                    if (clicked == true) {
                        div_map.transition()
                                .duration(500)
                                .style("opacity", 0);
                        if (d.properties.ADMIN.length > 12) {
                            div_map.style("width", "150px");
                        } else {
                            div_map.style("width", "70px");
                        };

                        div_map.transition()
                            .duration(200)
                            .style("opacity", .9);
                        if (d.stats[`q${Service}`]) {
                            cant_movies = d.stats[`q${Service}`];
                        } else {
                            cant_movies = 0
                        }
                        div_map.html(d.properties.ADMIN + "<br/>" + "<b>" + cant_movies + "</b>")
                        .style("left", (event.pageX) + "px")
                        .style("top", (event.pageY - 28) + "px");
   
                    };
                    
                    d3.select("h2.country-name").text(d.properties.ADMIN).style("color", "black");
                    buildGraf(d.properties.ADMIN, statsPaises);
                    for (p of countriesStats.features) {
                        map_svg.select(`path#${p.properties.ISO_A3}`).attr("stroke", "black").attr("stroke-width", 0.2).attr("opacity", 0.4);
                    };

                    map_svg.select(`path#${d.properties.ISO_A3}`).attr("stroke-width", 0.3).attr("opacity", 1);
                    clicked = true;
                    d3.select("h4.movies-name").text(`seleccione la barra de una plataforma para ver su listado de películas de ${d.properties.ADMIN}`).style("margin-top", 0).style("color", "dimgray");

                };
            };

        });
    };
};

// https://www.w3schools.com/howto/howto_js_full_page_tabs.asp
function openPage(pageName, elmnt, color) {
    // Hide all elements with class="tabcontent" by default */
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Remove the background color of all tablinks/buttons
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].style.backgroundColor = "";
    }
  
    // Show the specific tab content
    document.getElementById(pageName).style.display = "block";
  
    // Add the specific color to the button used to open the tab content
    elmnt.style.backgroundColor = color;

    // visualizer(pageName);
};

visualizer("Netflix");
visualizer("Prime");
visualizer("Hulu");
visualizer("Disney");
document.getElementById("defaultOpen").click();

let svg_graph = d3
  .select("body")
  .select("div.graph-container#graph")
  .append("svg")
  .attr("width", WIDTH2)
  .attr("height", HEIGHT2)
  .attr("class", "graph");

let contenedorEjeY = svg_graph
  .append("g")
  .attr("transform", `translate(${MARGIN2.left}, ${MARGIN2.top})`);

let contenedorEjeX = svg_graph
  .append("g")
  .attr("transform", `translate(${MARGIN2.left}, ${HEIGHT2 - MARGIN2.bottom})`);

let contenedorBarras = svg_graph
  .append("g")
  .attr("transform", `translate(${MARGIN2.left} ${MARGIN2.top})`);

let statsPaises = {};
d3.json("./data/countriesStats.json").then((datos) => {
    let stats_paises_uncleaned = datos["countries"].features;
    for (let e of stats_paises_uncleaned) {
        statsPaises[e.properties.ADMIN] = e.stats
    };
    buildGraf("None", statsPaises);
});