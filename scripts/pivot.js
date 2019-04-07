var nyt_data = null;
var authors = {}, articles = {}, keywords = {};
var authors_array = [], articles_array = [], keywords_array = [];
var facetToArticlePaths = {}, articleToFacetPaths = {};
var anchorSet = false;

/**
 * Formats and combines an author's first name and last name.
 * 
 * @param   {object}    author  contains author data
 * @returns the formatted author name
 * @see     /nyt.json
 */
var formatAuthorName = (author) => {
    var full_name = author["firstname"];
    full_name += (author["lastname"] !== null) ? " " + author["lastname"][0] + author["lastname"].slice(1).toLowerCase() : "";
    return full_name;
}

/**
 * Converts an object to an array containing the object's keys.
 * 
 * @param   {object}    object  contains key-value pairs
 * @param   {boolean}   sort    indicates whether the array needs to be sorted (descending order) by object key's value
 * @returns the array containing the object's keys
 */
var convertObjectToArray = (object, sort) => {
    var array = [];
    
    for(const key in object) {
        array.push(key);
    }

    if(sort) {
        array.sort((a, b) => { return object[b] - object[a]; });
    }

    return array;
}

/**
 * Creates an anchor for the selected author/keyword.
 * 
 * @param   {string}    facet   indicates the facet type ("authors"/"keywords")
 * @returns the text associated with the facet anchor (author name/topic)
 */
var createFacetAnchor = (facet) => {
    anchorSet = true;
    var facet_anchor = "";
    
    d3.select("#results")
    .selectAll("div")
    .each((d, i, n) => {
        var item = n[i]; // equivalent to d3.select(this) but works better

        // get text from facet anchor and add a "toBeDeleted" class for all other results
        var current_class = d3.select(item).attr("class");
        if(current_class === (facet + "-item-anchor")) {
            facet_anchor = d3.select(item).text();
            d3.select(item).style("font-size", "14px");
        } else {
            d3.select(item).attr("class", current_class + " toBeDeleted");
        }

        // position anchor on the left and hide other results
        d3.select(item)
        .style("display", () => {
            return (current_class === (facet + "-item-anchor")) ? "table" : "none";
        })
        .style("opacity", () => {
            return (current_class === (facet + "-item-anchor")) ? 1 : 0;
        })
        .text(() => {
            // clip anchor text if it exceeds 25 characters
            if(current_class === (facet + "-item-anchor")) {
                return (facet_anchor.length > 25) ? facet_anchor.slice(0, 25) + "..." : facet_anchor;   
            } else {
                return d3.select(item).text();
            }
        });

        d3.select(item)
        .style("background-color", (facet === "authors") ? "#3488BC" : "#CD5968")
        .transition()
        .duration(1000)
        .style("left", "10px")
        .style("top", "300px");
    });
    
    return facet_anchor;
}
/**
 * 
 */
var createArticleAnchor = () => {
    anchorSet = true;
    var article_anchor = "";
    
    d3.select("#results")
    .selectAll("div")
    .each((d, i, n) => {
        var item = n[i]; // equivalent to d3.select(this) but works better

        // get text from article anchor and add a "toBeDeleted" class for all other results
        var current_class = d3.select(item).attr("class");
        if(current_class === ("articles-item-anchor")) {
            article_anchor = d3.select(item).text();
            d3.select(item).style("font-size", "14px")
            .style("transform", "rotate(0deg)");
        } else {
            d3.select(item).attr("class", current_class + " toBeDeleted");
        }

        // position anchor on the left and hide other results
        d3.select(item)
        .style("display", () => {
            return (current_class === ("articles-item-anchor")) ? "table" : "none";
        })
        .style("opacity", () => {
            return (current_class === ("articles-item-anchor")) ? 1 : 0;
        })
        .text(() => {
            // clip anchor text if it exceeds 25 characters
            if(current_class === ("articles-item-anchor")) {
                return (article_anchor.length > 25) ? article_anchor.slice(0, 25) + "..." : article_anchor;   
            } else {
                return d3.select(item).text();
            }
        });

        d3.select(item)
        .style("background-color", "#62A55E")
        .transition()
        .duration(1000)
        .style("left", "10px")
        .style("top", "300px");
    });
    
    return article_anchor;
}

/**
 * Enables a sorting widget for the chosen anchor.
 * 
 */
var enableSortingWidget = () => {
    d3.select("#sort-widget")
    .style("left", "10px")
    .style("opacity", 1)
    .style("top", "250px")
    .style("visibility", "visible")
    .style("-webkit-transition-property", "opacity, visibility")
    .style("-webkit-transition-duration", "1s")
    .style("transition-property", "opacity, visibility")
    .style("transition-duration", "1s");

    d3.select("#sort-widget")
    .transition()
    .delay(1000)
    .style("display", "table");
}

/**
 * Enables an information label for the chosen anchor. 
 * 
 * @param   {string}    facet   indicates the facet type ("authors"/"keywords")
 */
var enableAnchorLabel = (facet = "articles") => {
    var facet_text = (facet === "authors") ? "news stories by" : (facet === "keywords") ? "news about" : "news related to";
    d3.select(".meta")
    .style("left", "10px")
    .style("opacity", 1)
    .style("top", "275px")
    .style("visibility", "visible")
    .style("-webkit-transition-property", "opacity, visibility")
    .style("-webkit-transition-duration", "1s")
    .style("transition-property", "opacity, visibility")
    .style("transition-duration", "1s")
    .text(facet_text);

    d3.select(".meta")
    .transition()
    .delay(1000)
    .style("display", "table");
}

/**
 * Filters articles based on the facet type and the facet anchor value.
 * 
 * @param   {object}    data            contains data of all articles
 * @param   {string}    facet           indicates the facet type ("authors"/"keywords")
 * @param   {string}    facet_anchor    text associated with the facet anchor (author name/topic)
 * @returns the object containing data of filtered articles
 */
var filterArticles = (data, facet, facet_anchor) => {
    var filtered_data = {};
    
    if(facet === "authors") {
        for(const url in data) {
            data[url][facet].forEach(author => {
                var name = formatAuthorName(author);
                if(name === facet_anchor) {
                    filtered_data[url] = data[url];
                }
            });
        }
    } else {
        facet = "topics";
        for(const url in data) {
            if(data[url][facet].includes(facet_anchor)) {
                filtered_data[url] = data[url];
            }
        }
    }
    
    return filtered_data;
}

/**
 * Generates a sequence of article items (based on the chosen facet anchor) with a counter that displays the number of visible articles.
 * 
 * @param   {string}    facet                   indicates the facet type ("authors"/"keywords")
 * @param   {array}     filtered_data_array     contains filtered article titles
 * @returns the number of visible articles
 */
var generateArticleItems = (facet, filtered_data_array, call = "facetResultClick") => {
    var left_margin = d3.select("." + facet + "-item-anchor").node().getBoundingClientRect().width - 10;
    var window_width = window.innerWidth - 200;
    var remaining_space  = window_width - (left_margin + 60);
    var items = filtered_data_array.length;
    var between_space = (items > 1) ? remaining_space / (items - 1) : 80;
    between_space = (between_space < 60) ? 60 : between_space;
    items = (between_space === 60) ? Math.floor(remaining_space / 60) + 1 : items;
    left_margin = (between_space > 60) ? left_margin - (between_space - 60) : left_margin;
    var temp_margin = left_margin;
    
    var article_items = d3.select("#results")
        .selectAll(".articles-item")
        .data(filtered_data_array.slice(0, items))
        .enter()
        .append("div")
        .attr("class", "articles-item")
        .style("left", () => {
            left_margin += between_space;
            return left_margin + "px";
        })
        .style("opacity", 0)
        .style("top", "200px")
        .style("transform", "rotate(45deg)")
        .style("transform-origin", "left center")
        .style("visibility", "hidden")
        .style("white-space", "nowrap");

    article_items
    .transition()
    .delay((call === "sortArticleItems") ? 500 : 1500)
    .style("opacity", 1)
    .style("visibility", "visible");

    article_items
        .on("click", (d, i, n) => articleResultClick(nyt_data, i, n))
        .on("mousemove", (d, i, n) => {
            var item = n[i];
            var x = d3.mouse(item)[0];
            var y = d3.mouse(item)[1];
            var current_class = d3.select(item).attr("class");
            var item_width = item.getBoundingClientRect().width;
            var detail_icon_condition = (x >= 2 && x <= 15 && y >= 2 && y <= 15);
            if(anchorSet) {
                detail_icon_condition = (x >= 2 && x <= 21 && y >= 2 && y <= 21);
            }
        
            d3.select(item)
            .attr("class", () => {
                if(current_class === "articles-item-anchor") {
                    if(detail_icon_condition) {
                        return current_class + "-detail";
                    } else if(x >= item_width - 19 && x <= item_width && y >= 2 && y <= 15) {
                        return current_class + " delete-cross";
                    } else {
                        return current_class;
                    }
                } else if(current_class === "articles-item-anchor-detail") {
                    return (detail_icon_condition) ? current_class : "articles-item-anchor";
                } else if(current_class === "articles-item-anchor delete-cross") {
                    return (x >= item_width - 19 && x <= item_width && y >= 2 && y <= 15) ? current_class : "articles-item-anchor";
                } else {
                    return (detail_icon_condition) ? "articles-item-detail" : "articles-item";
                }
            });
            d3.select(item)
            .attr("title", () => { return (detail_icon_condition) ? "Details" : (current_class === "articles-item") ? d : ""; });
        })
        .on("mouseout", (d, i, n) => {
            var item = n[i];
            var current_class = d3.select(item).attr("class");
            
            d3.select(item)
            .attr("class", () => {
                if(current_class === "articles-item-anchor" || current_class === "articles-item-anchor-detail" || current_class === "articles-item-anchor delete-cross") {
                    return "articles-item-anchor";
                } else {
                    return "articles-item";
                }
            });

            d3.selectAll(".authors-item")
            .style("background-color", "rgb(255, 255, 255, 0.5)");

            d3.selectAll(".articles-item")
            .style("background-color", "rgb(255, 255, 255, 0.5)");

            d3.selectAll(".keywords-item")
            .style("background-color", "rgb(255, 255, 255, 0.5)");

            d3.selectAll(".authors-item-anchor")
            .style("background-color", "#3488BC");

            d3.selectAll(".keywords-item-anchor")
            .style("background-color", "#CD5968");

            toggleHighlightCurves("reset");
        })
        .on("mouseover", (d, i, n) => {
            var item = n[i];
            var current_class = d3.select(item).attr("class");
            
            if(!(current_class === "articles-item-anchor" || current_class === "articles-item-anchor-detail" || current_class === "articles-item-anchor delete-cross")) {
                var article_value = d;
                var brushed_articles = nyt_data[articles[article_value]]["related-articles"];
                
                d3.selectAll(".authors-item")
                .style("background-color", (d) => {
                    var color = "rgb(255, 255, 255, 0.5)";

                    if(facetToArticlePaths[d] !== undefined) {
                        facetToArticlePaths[d].forEach(path => {
                            if(articleToFacetPaths[article_value].includes(path)) {
                                color = "#D5E6EC";
                            }
                        });
                    }

                    return color;
                });

                if(brushed_articles !== null) {
                    d3.selectAll(".articles-item")
                    .style("background-color", (d) => {
                        var color = "rgb(255, 255, 255, 0.5)";

                        brushed_articles.forEach(article => {
                            if(article["url"] === articles[d]) {
                                color = "#E3ECD5";
                            }
                        })

                        return color;
                    });
                }

                d3.selectAll(".keywords-item")
                .style("background-color", (d) => {
                    var color = "rgb(255, 255, 255, 0.5)";

                    if(facetToArticlePaths[d] !== undefined) {
                        facetToArticlePaths[d].forEach(path => {
                            if(articleToFacetPaths[article_value].includes(path)) {
                                color = "#F4E2E5";
                            }
                        });
                    }

                    return color;
                });

                toggleHighlightCurves("highlight-articles", "", "", {}, article_value);
            }
        })
        .text(d => { return (d.length > 30) ? d.slice(0, 30) + "..." : d; });
    
    var item_counter = d3.select(".item-counter")
    .style("left", temp_margin + between_space + 5 + "px")
    .style("opacity", 1)
    .style("top", /* d3.select(".articles-item").node().getBoundingClientRect().width + 200 + "px" */ () => {
        var article_position = d3.select(".articles-item").node().getBoundingClientRect();

        d3.selectAll(".articles-item")
        .each((d, i, n) => {
            var item = n[i];
            var temp = item.getBoundingClientRect();
            article_position = (article_position.width < temp.width) ? temp : article_position;
        });

        return article_position.width + 200 + "px";
    })
    .text(() => {
        if(items < filtered_data_array.length) {
            return items + " of " + filtered_data_array.length + " articles";
        } else {
            return (items > 1) ? items + " articles" : items + " article";
        }
    });

    item_counter
    .transition()
    .delay((call === "sortArticleItems") ? 600 : 1600)
    .style("display", "table");
    
    return items;
}

/**
 * 
 * @param {*} action 
 * @param {*} facet 
 * @param {*} facet_value 
 * @param {*} visible_facets 
 */
var toggleHighlightCurves = (action, facet = "", facet_value = "", visible_facets = {}, article_value = "") => {
    d3.selectAll("path")
    .each((d, i, n) => {
        var path = d3.select(n[i]);
        if(action === "highlight") {
            if(facetToArticlePaths[facet_value].includes(path.attr("d"))) {
                path.attr("stroke", (facet === "authors") ? "#04458B" : "#A51E33");
            }

            visible_facets[facet_value].forEach(article => {
                if(articleToFacetPaths[article].includes(path.attr("d"))) {
                    var stroke = path.attr("stroke");
                    if(facet === "authors") {
                        path.attr("stroke", (stroke === "#F4E2E5") ? "#A51E33" : stroke);
                    } else {
                        path.attr("stroke", (stroke === "#D5E6EC") ? "#04458B" : stroke);
                    }
                }
            });
        } else if(action === "highlight-articles") {
            if(articleToFacetPaths[article_value].includes(path.attr("d"))) {
                var stroke = path.attr("stroke");
                path.attr("stroke", (stroke === "#D5E6EC") ? "#04458B" : "#A51E33");
            }
        } else {
            var stroke = path.attr("stroke");
            path.attr("stroke", () => {
                if(stroke === "#04458B") {
                    return "#D5E6EC";
                } else if(stroke === "#A51E33") {
                    return "#F4E2E5";
                } else {
                    return stroke;
                }
            });
        }
    })
}

/**
 * Displays author and keyword items for the visible filtered articles.
 * 
 * @param   {string}    facet                   indicates the facet type ("authors"/"keywords")
 * @param   {number}    items                   number of visible articles
 * @param   {object}    visible_facets          contains array of filtered articles for each visible author name/topic
 * @param   {array}     visible_facets_array    contains visible author names/topics
 */
var displayFacetItems = (data, facet, items, visible_facets, visible_facets_array, call = "facetResultClick") => {
    var top_margin = (facet === "authors") ? 5 : window.innerHeight - 30;
    var article_position = d3.select(".articles-item").node().getBoundingClientRect();
    
    d3.selectAll(".articles-item")
    .each((d, i, n) => {
        var item = n[i];
        var temp = item.getBoundingClientRect();
        article_position = (article_position.width < temp.width) ? temp : article_position;
    })

    var remaining_space = (facet === "authors") ? article_position.top - 30 : top_margin - 30 - (article_position.top + article_position.width);
    var facet_items = visible_facets_array.length;
    var between_space = (facet_items > 1) ? remaining_space / (facet_items - 1) : 0;
    top_margin = (facet === "authors") ? top_margin - between_space : top_margin + between_space;
    var min_connections = items + 1, max_connections = 0;
    
    for(const f in visible_facets) {
        var temp = visible_facets[f].length;
        if(temp < min_connections) {
            min_connections = temp;
        }
        if(temp > max_connections) {
            max_connections = temp;
        }
    }

    visible_facets_array.sort((a, b) => {
        var primary_compare = visible_facets[b].length - visible_facets[a].length;
        var temp = (facet === "authors") ? authors : keywords;
        var secondary_compare = temp[b] - temp[a];
        var alpha_compare = (a > b) ? 1 : -1;
        return (primary_compare !== 0) ? primary_compare : (secondary_compare !== 0) ? secondary_compare : alpha_compare;
    })
    
    var facet_items = d3.select("#results")
        .selectAll("." + facet + "-item")
        .data(visible_facets_array)
        .enter()
        .append("div")
        .attr("class", facet + "-item")
        .style("font-size", (d, i) => {
            var connections = visible_facets[d].length;
            if(connections === min_connections) {
                return "9px";
            } else if(connections === max_connections) {
                return "14px";
            } else {
                return (9 + ((connections - min_connections) / (max_connections - min_connections)) * 5) + "px";
            }
        })
        .style("left", d => {
            var facet_articles = visible_facets[d];
            var total_x = 0;
            d3.selectAll(".articles-item")
            .each((d, i, n) => {
                var item = n[i];
                if(facet_articles.includes(d)) {
                    var article_x = item.getBoundingClientRect().x;
                    total_x += article_x;
                }
            });
            var avg_x = total_x / facet_articles.length;
            return avg_x + "px";
        })
        .style("opacity", 0)
        .style("visibility", "hidden");

    facet_items
    .transition()
    .delay((call === "sortArticleItems") ? 1000 : 2000)
    .style("opacity", 1)
    .style("visibility", "visible");

    facet_items
        .on("click", (d, i, n) => facetResultClick(facet, data, i, n))
        .on("mousemove", (d, i, n) => {
            var item = n[i];
            var x = d3.mouse(item)[0];
            var y = d3.mouse(item)[1];
            var current_class = d3.select(item).attr("class");
            var item_width = item.getBoundingClientRect().width;
            
            d3.select(item)
            .attr("class", () => {
                if(current_class === facet + "-item-anchor") {
                    if(x >= 2 && x <= 15 && y >= 2 && y <= 15) {
                        return current_class + "-detail"
                    } else if(x >= item_width - 13 && x <= item_width && y >= 2 && y <= 15) {
                        return current_class + " delete-cross";
                    } else {
                        return current_class;
                    }
                } else if(current_class === facet + "-item-anchor-detail") {
                    return (x >= 2 && x <= 15 && y >= 2 && y <= 15) ? current_class : facet + "-item-anchor";
                } else if(current_class === facet + "-item-anchor delete-cross") {
                    return (x >= item_width - 13 && x <= item_width && y >= 2 && y <= 15) ? current_class : facet + "-item-anchor";
                } else {
                    return (x >= 2 && x <= 15 && y >= 2 && y <= 15) ? facet + "-item-detail" : facet + "-item";
                }
            });

            d3.select(item)
            .attr("title", (x >= 2 && x <= 15 && y >= 2 && y <= 15) ? "Details" : "");
        })
        .on("mouseout", (d, i, n) => {
            var item = n[i];
            var current_class = d3.select(item).attr("class");
            
            d3.select(item)
            .attr("class", () => {
                if(current_class === facet + "-item-anchor" || current_class === facet + "-item-anchor-detail" || current_class === facet + "-item-anchor delete-cross") {
                    return facet + "-item-anchor";
                } else {
                    return facet + "-item";
                }
            });

            d3.selectAll(".authors-item")
            .style("background-color", "rgb(255, 255, 255, 0.5)");

            d3.selectAll(".articles-item")
            .style("background-color", "rgb(255, 255, 255, 0.5)");

            d3.selectAll(".keywords-item")
            .style("background-color", "rgb(255, 255, 255, 0.5)");

            d3.selectAll(".authors-item-anchor")
            .style("background-color", "#3488BC");

            d3.selectAll(".keywords-item-anchor")
            .style("background-color", "#CD5968");

            toggleHighlightCurves("reset");
        })
        .on("mouseover", (d, i, n) => {
            var item = n[i];
            var current_class = d3.select(item).attr("class");
            
            if(!(current_class === facet + "-item-anchor" || current_class === facet + "-item-anchor-detail" || current_class === facet + "-item-anchor delete-cross")) {
                var facet_value = d;
                var brushed_articles = visible_facets[facet_value];
                
                d3.selectAll(".authors-item")
                .style("background-color", (d) => {
                    var color = "rgb(255, 255, 255, 0.5)";
                    
                    brushed_articles.forEach(article => {
                        var temp = data[articles[article]]["authors"];
                        var author_names = [];
                        temp.forEach(author => {
                            author_names.push(formatAuthorName(author));
                        })

                        if(d !== facet_value && author_names.includes(d)) {
                            color = "#D5E6EC";
                        }

                        if(d === facet_value) {
                            color = "#fff";
                        }
                    });

                    return color;
                })

                d3.selectAll(".articles-item")
                .style("background-color", (d) => {
                    if(brushed_articles.includes(d)) {
                        return "#E3ECD5";
                    } else {
                        return "rgb(255, 255, 255, 0.5)";
                    }
                });

                d3.selectAll(".keywords-item")
                .style("background-color", (d) => {
                    var color = "rgb(255, 255, 255, 0.5)";
                    
                    brushed_articles.forEach(article => {
                        if(d !== facet_value && data[articles[article]]["topics"].includes(d)) {
                            color = "#F4E2E5";
                        }

                        if(d === facet_value) {
                            color = "#fff";
                        }
                    });

                    return color;
                })

                toggleHighlightCurves("highlight", facet, facet_value, visible_facets);
            }
        })
        .text(d => d);

        d3.select("#results")
        .selectAll("." + facet + "-item")
        .style("top", (d, i, n) => {
            var temp_space = between_space;
            if(i > 0) {
                var current = n[i].getBoundingClientRect();
                var previous = n[i - 1].getBoundingClientRect();
                if(current.x + current.width >= previous.x) {
                    var min_space = previous.height;
                    temp_space = (temp_space < min_space) ? min_space : between_space;
                }
            }
            top_margin = (facet === "authors") ? top_margin + temp_space : top_margin - temp_space;
            if((facet === "authors" && top_margin <= remaining_space) || (facet === "keywords" && top_margin >= article_position.top + article_position.width)){
                return top_margin + "px";
            } else {
                return "-100px";
            }
        });
}

/**
 * 
 * @param {*} facet 
 * @param {*} visible_facets 
 */
var drawCurves = (facet, visible_facets, call = "facetResultClick") => {
    d3.selectAll("." + facet + "-item")
    .each((d, i, n) => {
        if(d3.select(n[i]).style("top") !== "-100px"){
            var source = n[i].getBoundingClientRect();
            var x1 = source.x + source.width / 2;
            var y1 = source.y;
            y1 = (facet === "authors") ? y1 + source.height : y1;
    
            var facet_data = d;
            d3.selectAll(".articles-item")
            .each((d, i, n) => {
                if(visible_facets[facet_data].includes(d)) {
                    var temp_node = d3.select(n[i]);

                    temp_node.style("transform", "rotate(0deg)");
                    var target = n[i].getBoundingClientRect();
                    var actual_width = target.width;

                    temp_node.style("transform", "rotate(45deg)");
                    target = n[i].getBoundingClientRect();

                    var x2 = target.x;
                    x2 = (facet === "authors") ? x2 + 10 : x2 + 5 + actual_width / Math.sqrt(2);
                    var y2 = target.y;
                    y2 = (facet === "authors") ? y2 + 5 : y2 + target.height - 5;
    
                    var temp = (y2 - y1) / 34;
                    var points = [[x1, y1], [x1, y1 + temp * 10], [x2, y2 - temp * 7], [x2, y2]];
                    var line_gen = d3.line()
                        .curve(d3.curveBasis);
                    var path_data = line_gen(points);
                    var svg = d3.select("svg")
                        .append("path")
                        .attr("fill", "none")
                        .attr("stroke", () => {
                            return (facet === "authors") ? "#D5E6EC" : "#F4E2E5";
                        })
                        .attr("d", path_data);

                    svg
                    .transition()
                    .delay((call === "sortArticleItems") ? 1500 : 2500)
                    .style("visibility", "visible");

                    if(facetToArticlePaths[facet_data] === undefined) {
                        facetToArticlePaths[facet_data] = [];
                    } 
                    facetToArticlePaths[facet_data].push(path_data);

                    if(articleToFacetPaths[d] === undefined) {
                        articleToFacetPaths[d] = [];
                    } 
                    articleToFacetPaths[d].push(path_data);
                }
            })
        }
    })
}

/**
 * Generates author and keyword items for the visible filtered articles.
 * 
 * @param   {string}    facet                   indicates the facet type ("authors"/"keywords")
 * @param   {string}    facet_anchor            text associated with the facet anchor (author name/topic)
 * @param   {object}    filtered_data           contains data of filtered articles
 * @param   {array}     filtered_data_array     contains filtered article titles
 * @param   {number}    items                   number of visible articles
 */
var generateFacetItems = (data, facet, facet_anchor, filtered_data, filtered_data_array, items, call = "facetResultClick") => {
    var visible_articles = filtered_data_array.slice(0, items);
    var visible_authors = {};
    var visible_keywords = {};
    
    for(const url in filtered_data) {
        if(visible_articles.includes(filtered_data[url]["article"])) {
            filtered_data[url]["authors"].forEach(author => {
                var name = formatAuthorName(author);
                if(facet === "authors" && name === facet_anchor) {
                    // do nothing
                } else {
                    if(visible_authors[name] === undefined) {
                        visible_authors[name] = [];
                    }
                    visible_authors[name].push(filtered_data[url]["article"]);
                }
            });
            filtered_data[url]["topics"].forEach(keyword => {
                if(facet === "keywords" && keyword === facet_anchor) {
                    // do nothing
                } else {
                    if(visible_keywords[keyword] === undefined) {
                        visible_keywords[keyword] = [];
                    }
                    visible_keywords[keyword].push(filtered_data[url]["article"]);
                }
            });
        }
    }

    visible_authors_array = convertObjectToArray(visible_authors, false);
    visible_keywords_array = convertObjectToArray(visible_keywords, false);

    displayFacetItems(data, "authors", items, visible_authors, visible_authors_array, call);
    displayFacetItems(data, "keywords", items, visible_keywords, visible_keywords_array, call);
    drawCurves("authors", visible_authors, call);
    drawCurves("keywords", visible_keywords, call);
}

/**
 * 
 * @param {*} facet 
 * @param {*} text 
 * @param {*} node 
 */
var showFacetDetail = (facet, text, node) => {
    var color = (facet === "authors") ? "#3488BC" : "#CD5968";
    var item = node.getBoundingClientRect();
    var x = item.x;
    var y = item.y + item.height / 2;

    d3.select("#detail")
    .attr("class", "detail-show")
    .style("border", "2px solid " + color);

    var title = text;
    var temp = (facet === "authors") ? authors : keywords;
    var stats = temp[text];
    stats += (temp[text] > 1) ? " articles" : " article";
    var search_string = "";

    for(var i = 0; i < text.length; i++) {
        if(text[i] !== " ") {
            search_string += text[i];
        } else {
            search_string += "+";
        }
    }

    var link = `https://www.google.com/search?q=${search_string}+nytimes`;
    var link_text = "Google Search";

    d3.select("#title")
    .text(title);

    d3.select("#subtitle")
    .text("");

    d3.select("#desc")
    .text("");

    d3.select("#stats")
    .text(stats);
    
    d3.select("#link")
    .select("a")
    .attr("href", link)
    .style("color", color)
    .text(link_text);

    var detail_width = d3.select("#detail").node().getBoundingClientRect().width;
    var detail_height = d3.select("#detail").node().getBoundingClientRect().height;

    if(anchorSet === false) {
        d3.select("#detail")
        .style("left", (x - detail_width - 20) + "px")
        .style("top", (y - 0.5 * detail_height) + "px");
    } else {
        var item_class = d3.select(node).attr("class");
        var margin = 5;

        var detail_x = item.x + (item.width - detail_width) / 2;
        if(item_class === facet + "-item-anchor-detail") {
            detail_x = margin;
        }

        var detail_y = item.top - margin - detail_height;
        if(item_class === "authors-item-detail") {
            detail_y = item.top + margin + item.height;
        }

        d3.select("#detail")
        .style("left", detail_x + "px")
        .style("top", detail_y + "px");
    }
}

var showArticleDetail = (data, text, node) => {
    var color = "#62A55E";
    var item = node.getBoundingClientRect();
    var x = item.x;
    var y = item.y + item.height / 2;

    d3.select("#detail")
    .attr("class", "detail-show")
    .style("border", "2px solid " + color)

    var date = new Date(data[articles[text]]["date"]);
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var formatted_date = date.toLocaleDateString("en", options);

    var title = text.slice(0, 30) + "...";
    var subtitle = formatted_date;
    var desc = data[articles[text]]["abstract"].slice(0, 50) + "...";
    var related_articles = data[articles[text]]["related-articles"];
    var stats = (related_articles !== null) ? related_articles.length : 0;
    stats += (stats === 1) ? " related article" : " related articles";
    var link = articles[text];
    var link_text = "Read Full Article at The New York Times";

    d3.select("#title")
    .text(title);

    d3.select("#subtitle")
    .text(subtitle);

    d3.select("#desc")
    .text(desc);

    d3.select("#stats")
    .text(stats);
    
    d3.select("#link")
    .select("a")
    .attr("href", link)
    .style("color", color)
    .text(link_text);

    var detail_width = d3.select("#detail").node().getBoundingClientRect().width;
    var detail_height = d3.select("#detail").node().getBoundingClientRect().height;

    if(anchorSet === false) {
        d3.select("#detail")
        .style("left", (x - detail_width - 20) + "px")
        .style("top", (y - 0.5 * detail_height) + "px");
    } else {
        var item_class = d3.select(node).attr("class");
        var margin = 5;

        var detail_x = item.x + (item.width - detail_width) / 2;
        // if(item_class === "articles-item-anchor-detail") {
        //     detail_x = margin;
        // }
        // if detail x + detail width is beyond window x then shift x by the offset
        if(detail_x + detail_width >= window.innerWidth - 20) {
            detail_x -= (detail_x + detail_width - window.innerWidth + 20);
        }

        var detail_y = item.top - margin - detail_height;
    
        d3.select("#detail")
        .style("left", detail_x + "px")
        .style("top", detail_y + "px");
    }
}

/**
 * 
 * @param {*} option 
 */
var resetLayout = (option = "") => {
    if(option === "all") {
        d3.select("#results")
        .selectAll("div")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();

        anchorSet = false;

        d3.select(".search-box")
        .style("display", "block")
        .style("opacity", 1)
        .style("visibility", "visible")
        .property("value", "")
        .node().focus();
    }

    d3.selectAll("path")
    .remove();

    d3.select("#sort-widget")
    .style("display", "none")
    .style("opacity", 0);

    d3.select(".meta")
    .style("display", "none")
    .style("opacity", 0);

    d3.select(".item-counter")
    .style("display", "none")
    .style("opacity", 0);
}

/**
 * 
 * @param {*} facet 
 * @param {*} data 
 * @param {*} i 
 * @param {*} n 
 */
var facetResultClick = (facet, data, i, n) => {
    var item = n[i];
    var x = d3.mouse(item)[0];
    var y = d3.mouse(item)[1];
    var item_width = n[i].getBoundingClientRect().width;
    var item_class = d3.select(item).attr("class");

    d3.select(item)
    .attr("class", () => {
        if(x >= 2 && x <= 15 && y >= 2 && y <= 15 && item_class !== facet + "-item-anchor") {
            if(item_class === facet + "-item-detail") {
                d3.select("#results")
                .selectAll("div")
                .filter((d, i, n) => {
                    var item = d3.select(n[i]);
                    var background_img = item.style("background-image");
                    return background_img.includes("dark.png");
                })
                .each((d, i, n) => {
                    var item = d3.select(n[i]);
                    item.style("background-image", null);
                });

                d3.select(item)
                .style("background-image", () => {
                    var background_img = `url("assets/` + facet.slice(0, -1) + `_dark.png"), url("assets/delete.png")`;
                    return background_img;
                });
            }
            return (item_class === facet + "-item-anchor-detail") ? item_class : facet + "-item-detail";
        } else {
            if(item_class !== facet + "-item-anchor") {
                d3.select(".authors-item-anchor")
                .remove();
                d3.select(".keywords-item-anchor")
                .remove();
                d3.select(".articles-item-anchor")
                .remove();
                resetLayout();
            }

            return facet + "-item-anchor";
        }
    });

    if(x >= 2 && x <= 15 && y >= 2 && y <= 15) {
        showFacetDetail(facet, d3.select(item).data()[0], n[i]);
    } else if(x >= item_width - 13 && x <= item_width && y >= 2 && y <= 15 && item_class === facet + "-item-anchor delete-cross") {
        resetLayout("all");
    } else {
        if(item_class !== facet + "-item-anchor") {
            d3.select(".search-box")
            .style("opacity", 0)
            .style("visibility", "hidden")
            .style("-webkit-transition-property", "opacity, visibility")
            .style("-webkit-transition-duration", "1s")
            .style("transition-property", "opacity, visibility")
            .style("transition-duration", "1s");

            d3.select(".search-box")
            .transition()
            .delay(2000)
            .style("display", "none");

            d3.select("#favicon")
            .remove();

            var set_icon = d3.select("head")
            .append("link")
            .attr("id", "favicon")
            .attr("rel", "icon")
            .attr("href", "assets/" + facet.slice(0, -1) + "_dark.png");

            var title_text = d3.select("title")
            .text(d3.select(n[i]).text());

            var facet_anchor = createFacetAnchor(facet);

            d3.selectAll(".toBeDeleted")
            .remove();

            enableSortingWidget();
            enableAnchorLabel(facet);

            var filtered_data = filterArticles(data, facet, facet_anchor);
            var filtered_data_array = [];

            for(const key in filtered_data) {
                var article_title = filtered_data[key]["article"];
                filtered_data_array.push(article_title);
            }

            sortArticleItems(data, facet, facet_anchor);
            var items = generateArticleItems(facet, filtered_data_array);
            generateFacetItems(data, facet, facet_anchor, filtered_data, filtered_data_array, items);
        }
    }
}

var articleResultClick = (data, i, n) => {
    var item = n[i];
    var x = d3.mouse(item)[0];
    var y = d3.mouse(item)[1];
    var detail_icon_condition = (x >= 2 && x <= 15 && y >= 2 && y <= 15);
    if(anchorSet) {
        detail_icon_condition = (x >= 2 && x <= 21 && y >= 2 && y <= 21);
    }
    var item_width = n[i].getBoundingClientRect().width;
    var item_class = d3.select(item).attr("class");

    d3.select(item)
    .attr("class", () => {
        if(detail_icon_condition && item_class !== "articles-item-anchor") {
            if(item_class === "articles-item-detail") {
                d3.select("#results")
                .selectAll("div")
                .filter((d, i, n) => {
                    var item = d3.select(n[i]);
                    var background_img = item.style("background-image");
                    return background_img.includes("dark.png");
                })
                .each((d, i, n) => {
                    var item = d3.select(n[i]);
                    item.style("background-image", null);
                });

                d3.select(item)
                .style("background-image", () => {
                    var background_img = `url("assets/article_dark.png"), url("assets/delete.png")`;
                    return background_img;
                });
            }
            return (item_class === "articles-item-anchor-detail") ? item_class : "articles-item-detail";
        } else {
            if(item_class !== "articles-item-anchor") {
                d3.select(".authors-item-anchor")
                .remove();
                d3.select(".keywords-item-anchor")
                .remove();
                d3.select(".articles-item-anchor")
                .remove();
                resetLayout();
            }

            return "articles-item-anchor";
        }
    });

    if(detail_icon_condition) {
        showArticleDetail(data, d3.select(item).data()[0], n[i]);
    } else if(x >= item_width - 13 && x <= item_width && y >= 2 && y <= 15 && item_class === "articles-item-anchor delete-cross") {
        resetLayout("all");
    } else {
        if(item_class !== "articles-item-anchor") {
            d3.select(".search-box")
            .style("opacity", 0)
            .style("visibility", "hidden")
            .style("-webkit-transition-property", "opacity, visibility")
            .style("-webkit-transition-duration", "1s")
            .style("transition-property", "opacity, visibility")
            .style("transition-duration", "1s");

            d3.select(".search-box")
            .transition()
            .delay(2000)
            .style("display", "none");

            d3.select("#favicon")
            .remove();

            var set_icon = d3.select("head")
            .append("link")
            .attr("id", "favicon")
            .attr("rel", "icon")
            .attr("href", "assets/article_dark.png");

            var title_text = d3.select("title")
            .text(d3.select(n[i]).text());

            var article_anchor = createArticleAnchor();

            d3.selectAll(".toBeDeleted")
            .remove();

            enableSortingWidget();
            enableAnchorLabel();

            var filtered_data = {};
    
            var article_title = d3.select(item).data()[0];
            if(data[articles[article_title]]["related-articles"] !== null) {
                data[articles[article_title]]["related-articles"].forEach(article => {
                    if(data[article["url"]] !== undefined) {
                        filtered_data[article["url"]] = data[article["url"]];
                    }
                });
            }

            var filtered_data_array = [];

            for(const key in filtered_data) {
                var article_title = filtered_data[key]["article"];
                filtered_data_array.push(article_title);
            }

            sortArticleItems(data, "articles", article_anchor, filtered_data, filtered_data_array);
            var items = generateArticleItems("articles", filtered_data_array)
            generateFacetItems(data, "articles", article_anchor, filtered_data, filtered_data_array, items);
        }
    }
}

var sortArticleItems = (data, facet, facet_anchor, filtered_data = {}, filtered_data_array = []) => {
    var sort_widget = d3.select(".sort");

    sort_widget
    .property("value", "0");

    sort_widget
    .on("click", () => {
        sort_widget
        .on("change", () => {
            if(facet !== "articles") {
                filtered_data = filterArticles(data, facet, facet_anchor);
                filtered_data_array = [];

                for(const key in filtered_data) {
                    var article_title = filtered_data[key]["article"];
                    filtered_data_array.push(article_title);
                }
            }

            if(sort_widget.property("value") === "1") {
                filtered_data_array.sort(() => {
                    var x = Math.random();
                    var y = Math.random();
                    var compare = x - y;
                    return compare;
                });
            }

            d3.selectAll("path")
            .remove();

            d3.select(".item-counter")
            .style("display", "none")
            .style("opacity", 0);

            d3.select("#results")
            .selectAll("div")
            .each((d, i, n) => {
                var item = n[i];

                var current_class = d3.select(item).attr("class");
                if(current_class !== (facet + "-item-anchor")) {
                    d3.select(item).attr("class", current_class + " toBeDeleted");
                }

                d3.select(item)
                .style("display", () => {
                    return (current_class === (facet + "-item-anchor")) ? "table" : "none";
                })
                .style("opacity", () => {
                    return (current_class === (facet + "-item-anchor")) ? 1 : 0;
                })
            });

            d3.selectAll(".toBeDeleted")
            .remove();

            var items = generateArticleItems(facet, filtered_data_array, "sortArticleItems");
            generateFacetItems(data, facet, facet_anchor, filtered_data, filtered_data_array, items, "sortArticleItems");
        })
    });
}

// loading the data
d3.json("nyt.json").then(data => {
    nyt_data = data;
    // compute author and keyword frequency; also map article titles to URLs 
    for(const url in data) {
        if(data[url]["authors"].length !== 0) {
            data[url]["authors"].forEach(author => {
                var name = formatAuthorName(author);

                if(authors[name] === undefined) {
                    authors[name] = 1;
                } else {
                    authors[name]++;
                }
            });
        }

        articles[data[url]["article"]] = url;

        data[url]["topics"].forEach(keyword => {
            if(keywords[keyword] === undefined) {
                keywords[keyword] = 1;
            } else {
                keywords[keyword]++;
            }
        });
    }

    authors_array = convertObjectToArray(authors, true);
    articles_array = convertObjectToArray(articles, false);
    keywords_array = convertObjectToArray(keywords, true);

    // handling events when search input changes
    var text = d3.select("input")
        .on("input", () => {

            // remove existing search results
            d3.selectAll(".authors-item, .articles-item, .keywords-item")
            .remove();

            // hide/show search results depending on input value
            var value = d3.select("input").property("value").toLowerCase();
            d3.select("#results")
            .attr("class", () => { return (value === "") ? "results-empty" : "results"; });
            
            // get all authors, articles, and keywords with input value as a substring 
            var temp_authors = authors_array.filter(author => {
                return author.toLowerCase().includes(value);
            });
            var temp_articles = articles_array.filter(article => {
                return article.toLowerCase().includes(value);
            });
            var temp_keywords = keywords_array.filter(keyword => {
                return keyword.toLowerCase().includes(value);
            });

            // initial top margin for search results
            var top_margin = 185;

            // handling search results for authors
            var author_results = d3.select("#results")
                .selectAll(".authors-item")
                .data(temp_authors.slice(0, 4)) // may need to do this a little differently
                .enter()
                .append("div")
                .attr("class", "authors-item")
                .style("left", (d, i, n) => {
                    return n[i].parentNode.getBoundingClientRect().x + "px";
                })
                .style("top", () => {
                    top_margin += 30;
                    return top_margin + "px";
                })
                .on("click", (d, i, n) => facetResultClick("authors", data, i, n))
                .on("mousemove", (d, i, n) => {
                    var item = n[i];
                    var x = d3.mouse(item)[0];
                    var y = d3.mouse(item)[1];
                    var current_class = d3.select(item).attr("class");
                    var item_width = item.getBoundingClientRect().width;
                    d3.select(item)
                    .attr("class", () => {
                        if(current_class === "authors-item-anchor") {
                            if(x >= 2 && x <= 15 && y >= 2 && y <= 15) {
                                return current_class + "-detail"
                            } else if(x >= item_width - 13 && x <= item_width && y >= 2 && y <= 15) {
                                return current_class + " delete-cross";
                            } else {
                                return current_class;
                            }
                        } else if(current_class === "authors-item-anchor-detail") {
                            return (x >= 2 && x <= 15 && y >= 2 && y <= 15) ? current_class : "authors-item-anchor";
                        } else if(current_class === "authors-item-anchor delete-cross") {
                            return (x >= item_width - 13 && x <= item_width && y >= 2 && y <= 15) ? current_class : "authors-item-anchor";
                        }
                        else {
                            return (x >= 2 && x <= 15 && y >= 2 && y <= 15) ? "authors-item-detail" : "authors-item";
                        }
                    });

                    d3.select(item)
                    .attr("title", (x >= 2 && x <= 15 && y >= 2 && y <= 15) ? "Details" : "");
                })
                .on("mouseout", (d, i, n) => {
                    var item = n[i];
                    var current_class = d3.select(item).attr("class");
                    d3.select(item)
                    .attr("class", () => {
                        if(current_class === "authors-item-anchor" || current_class === "authors-item-anchor-detail" || current_class === "authors-item-anchor delete-cross") {
                            return "authors-item-anchor";
                        } else {
                            return "authors-item";
                        }
                    });
                })
                .text(d => d);

            var article_results = d3.select("#results")
                .selectAll(".articles-item")
                .data(temp_articles.slice(0, 4))
                .enter()
                .append("div")
                .attr("class", "articles-item")
                .style("left", (d, i, n) => {
                    return n[i].parentNode.getBoundingClientRect().x + "px";
                })
                .style("top", () => {
                    top_margin += 30;
                    return top_margin + "px";
                })
                .on("click", (d, i, n) => articleResultClick(nyt_data, i, n))
                .on("mousemove", (d, i, n) => {
                    var item = n[i];
                    var x = d3.mouse(item)[0];
                    var y = d3.mouse(item)[1];
                    var current_class = d3.select(item).attr("class");
                    var item_width = item.getBoundingClientRect().width;
                    var detail_icon_condition = (x >= 2 && x <= 15 && y >= 2 && y <= 15);
                    if(anchorSet) {
                        detail_icon_condition = (x >= 2 && x <= 21 && y >= 2 && y <= 21);
                    }
                
                    d3.select(item)
                    .attr("class", () => {
                        if(current_class === "articles-item-anchor") {
                            if(detail_icon_condition) {
                                return current_class + "-detail";
                            } else if(x >= item_width - 19 && x <= item_width && y >= 2 && y <= 15) {
                                return current_class + " delete-cross";
                            } else {
                                return current_class;
                            }
                        } else if(current_class === "articles-item-anchor-detail") {
                            return (detail_icon_condition) ? current_class : "articles-item-anchor";
                        } else if(current_class === "articles-item-anchor delete-cross") {
                            return (x >= item_width - 19 && x <= item_width && y >= 2 && y <= 15) ? current_class : "articles-item-anchor";
                        } else {
                            return (detail_icon_condition) ? "articles-item-detail" : "articles-item";
                        }
                    });
                    d3.select(item)
                    .attr("title", () => { return (detail_icon_condition) ? "Details" : (current_class === "articles-item") ? d : ""; });
                })
                .on("mouseout", (d, i, n) => {
                    var item = n[i];
                    var current_class = d3.select(item).attr("class");
                    
                    d3.select(item)
                    .attr("class", () => {
                        if(current_class === "articles-item-anchor" || current_class === "articles-item-anchor-detail" || current_class === "articles-item-anchor delete-cross") {
                            return "articles-item-anchor";
                        } else {
                            return "articles-item";
                        }
                    });

                    d3.selectAll(".authors-item")
                    .style("background-color", "rgb(255, 255, 255, 0.5)");

                    d3.selectAll(".articles-item")
                    .style("background-color", "rgb(255, 255, 255, 0.5)");

                    d3.selectAll(".keywords-item")
                    .style("background-color", "rgb(255, 255, 255, 0.5)");

                    d3.selectAll(".authors-item-anchor")
                    .style("background-color", "#3488BC");

                    d3.selectAll(".keywords-item-anchor")
                    .style("background-color", "#CD5968");

                    toggleHighlightCurves("reset");
                })
                .on("mouseover", (d, i, n) => {
                    var item = n[i];
                    var current_class = d3.select(item).attr("class");
                    
                    if(!(current_class === "articles-item-anchor" || current_class === "articles-item-anchor-detail" || current_class === "articles-item-anchor delete-cross")) {
                        var article_value = d;
                        var brushed_articles = nyt_data[articles[article_value]]["related-articles"];
                        
                        d3.selectAll(".authors-item")
                        .style("background-color", (d) => {
                            var color = "rgb(255, 255, 255, 0.5)";

                            if(facetToArticlePaths[d] !== undefined) {
                                facetToArticlePaths[d].forEach(path => {
                                    if(articleToFacetPaths[article_value].includes(path)) {
                                        color = "#D5E6EC";
                                    }
                                });
                            }

                            return color;
                        });

                        if(brushed_articles !== null) {
                            d3.selectAll(".articles-item")
                            .style("background-color", (d) => {
                                var color = "rgb(255, 255, 255, 0.5)";

                                brushed_articles.forEach(article => {
                                    if(article["url"] === articles[d]) {
                                        color = "#E3ECD5";
                                    }
                                })

                                return color;
                            });
                        }

                        d3.selectAll(".keywords-item")
                        .style("background-color", (d) => {
                            var color = "rgb(255, 255, 255, 0.5)";

                            if(facetToArticlePaths[d] !== undefined) {
                                facetToArticlePaths[d].forEach(path => {
                                    if(articleToFacetPaths[article_value].includes(path)) {
                                        color = "#F4E2E5";
                                    }
                                });
                            }

                            return color;
                        });

                        toggleHighlightCurves("highlight-articles", "", "", {}, article_value);
                    }
                })
                .text(d => d);

            var keyword_results = d3.select("#results")
                .selectAll(".keywords-item")
                .data(temp_keywords.slice(0, 4))
                .enter()
                .append("div")
                .attr("class", "keywords-item")
                .style("left", (d, i, n) => {
                    return n[i].parentNode.getBoundingClientRect().x + "px";
                })
                .style("top", () => {
                    top_margin += 30;
                    return top_margin + "px";
                })
                .on("click", (d, i, n) => facetResultClick("keywords", data, i, n))
                .on("mousemove", (d, i, n) => {
                    var item = n[i];
                    var x = d3.mouse(item)[0];
                    var y = d3.mouse(item)[1];
                    var current_class = d3.select(item).attr("class");
                    var item_width = item.getBoundingClientRect().width;

                    d3.select(item)
                    .attr("class", () => {
                        if(current_class === "keywords-item-anchor") {
                            if(x >= 2 && x <= 15 && y >= 2 && y <= 15) {
                                return current_class + "-detail"
                            } else if(x >= item_width - 13 && x <= item_width && y >= 2 && y <= 15) {
                                return current_class + " delete-cross";
                            } else {
                                return current_class;
                            }
                        } else if(current_class === "keywords-item-anchor-detail") {
                            return (x >= 2 && x <= 15 && y >= 2 && y <= 15) ? current_class : "keywords-item-anchor";
                        } else if(current_class === "keywords-item-anchor delete-cross") {
                            return (x >= item_width - 13 && x <= item_width && y >= 2 && y <= 15) ? current_class : "keywords-item-anchor";
                        }
                        else {
                            return (x >= 2 && x <= 15 && y >= 2 && y <= 15) ? "keywords-item-detail" : "keywords-item";
                        }
                    });

                    d3.select(item)
                    .attr("title", (x >= 2 && x <= 15 && y >= 2 && y <= 15) ? "Details" : "");
                })
                .on("mouseout", (d, i, n) => {
                    var item = n[i];
                    var current_class = d3.select(item).attr("class");
                    d3.select(item)
                    .attr("class", () => {
                        if(current_class === "keywords-item-anchor" || current_class === "keywords-item-anchor-detail" || current_class === "keywords-item-anchor delete-cross") {
                            return "keywords-item-anchor";
                        } else {
                            return "keywords-item";
                        }
                    });
                })
                .text(d => d);
        });    
    
    // handling the help button
    d3.select(".help")
    .on("click", () => {
        d3.select(".backdrop")
        .attr("class", "backdrop-view")
        .on("click", () => {
            d3.select(".backdrop-view")
            .attr("class", "backdrop");
    
            d3.select(".overlay-view")
            .attr("class", "overlay");
        });

        d3.select(".overlay")
        .attr("class", "overlay-view");
    });

    // handling detail overlay hide and detail icon highlight
    d3.select("body")
    .on("click", () => {
        var target = d3.select(d3.event.target);
        if(target.attr("class") === null || !target.attr("class").includes("-detail")) {
            d3.select("#detail")
            .attr("class", "detail-hide");

            d3.select("#results")
            .selectAll("div")
            .filter((d, i, n) => {
                var item = d3.select(n[i]);
                var background_img = item.style("background-image");
                return background_img.includes("dark.png");
            })
            .each((d, i, n) => {
                var item = d3.select(n[i]);
                item.style("background-image", null);
            });
        }
    })
});