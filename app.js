//importing modules
var express = require( 'express' );
var request = require( 'request' );
var cheerio = require( 'cheerio' );

//creating a new express server
var app = express();

//setting EJS as the templating engine
app.set( 'view engine', 'ejs' );

//setting the 'assets' directory as our static assets dir (css, js, img, etc...)
app.use( '/assets', express.static( 'assets' ) );


var lbcData = {
    Title: "General information of the property",
    price: 0,
    surface: 0,
    city: '',
    room: '',
    type: '',
    priceM2: 0,
};

var estimation_property = {
    Title: "Estate valuation",
    Averageprice: 0,
}



function callleboncoin( url ) {
    var url = 'https://www.leboncoin.fr/ventes_immobilieres/1036652470.htm?ca=12_s'
    request( url, function ( error, response, html ) {
        if ( !error && response.statusCode == 200 ) {

            const $ = cheerio.load( html )

            const lbcDataArray = $( 'section.properties span.value' )

            lbcData = {
                price: parseInt( $( lbcDataArray.get( 0 ) ).text().replace( /\s/g, '' ), 10 ),
                city: $( lbcDataArray.get( 1 ) ).text().trim().toLowerCase().replace( /\_|\s/g, '-' ),
                type: $( lbcDataArray.get( 2 ) ).text().trim().toLowerCase(),
                room: $( lbcDataArray.get( 3 ) ).text(),
                surface: parseInt( $( lbcDataArray.get( 4 ) ).text().replace( /\s/g, '' ), 10 ),
                priceM2: parseInt( $( lbcDataArray.get( 0 ) ).text().replace( /\s/g, '' ), 10 ) / parseInt( $( lbcDataArray.get( 4 ) ).text().replace( /\s/g, '' ), 10 ),

            }
            console.log( lbcData )
        }
        else {
            console.log( error )
        }
    })
}


function calllemeilleuragent() {
    var url2 = 'https://www.meilleursagents.com/prix-immobilier/' + lbcData.city.toLowerCase()
    request( url2, function ( error, response, html ) {
        if ( !error && response.statusCode == 200 ) {

            const $ = cheerio.load( html )

            var averagePrice = ""
            $( 'div.small-12.medium-6.columns.prices-summary__cell--row-header ' ).each( function ( i, element ) {
                var a = $( this );
                //prix au m2 d'un appartement : 
                if ( lbcData.type == "Appartement" ) {

                    if ( a.children()[0].next.data == "Prix m2 appartement" ) {
                        averagePrice = a.next().next().text();
                        averagePrice = averagePrice.substring( 2, 5 );
                        averagePrice = averagePrice.split( " " );
                        estimation_property.Averageprice = averagePrice[0] + averagePrice[1];
                    }
                }

                //prix au m2 d'une maison : 
                if ( lbcData.type == "Maison" ) {
                    if ( a.children()[0].next.data == " Prix m2 maison" ) {
                        averagePrice = a.next().next().text();
                        averagePrice = averagePrice.substring( 2, 5 );
                        averagePrice = averagePrice.split( " " );
                        estimation_property.Averageprice = averagePrice[0] + averagePrice[1];
                    }
                }
            })
        }
    })

}

//Il ne reste plus qu'à comparer les deux valeurs et donner un verdict : 
var comparateur = "";
if ( estimation_property.Averageprice < lbcData.priceM2 ) {
    comparateur = "Le prix au m2 de ce bien est au dessus de la moyenne du marché.";
}
if ( estimation_property.Averageprice == lbcData.priceM2 ) {
    comparateur = "Le prix au m2 de ce bien correspond à celui de la moyenne du marché."
}
if ( estimation_property.Averageprice > lbcData.priceM2 ) {
    comparateur = "Le prix au m2 de ce bien est inférieur à celui de la moyenne du marché, peut être une bonne affaire!"
};

app.get( '/', function ( req, res ) {
    var url = req.query.urlLBC
    callleboncoin( url );
    calllemeilleuragent();
    res.render( 'home', {
        message: url,
        RealEstateAdPrice: lbcData.price,
        RealEstateAdSurface: lbcData.surface,
        RealEstateAdPricePerM2: lbcData.priceM2,
        RealEstateAdType: lbcData.type,
        RealEstateAdCity: lbcData.city,
        message1: estimation_property.Averageprice,
        message2: comparateur,
    });
});


//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
});
