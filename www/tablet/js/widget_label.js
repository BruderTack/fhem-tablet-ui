if(typeof widget_widget == 'undefined') {
    loadplugin('widget_widget');
}

var widget_label = $.extend({}, widget_widget, {
    widgetname:"label",
    init_attr: function(elem) {
        elem.initData('get'         , 'STATE');
        elem.initData('part'        , -1);
        elem.initData('unit'        , '' );
        elem.initData('color'       , '');
        elem.initData('limits'      , []);
        elem.initData('colors'      , ['#505050']);
        elem.initData('limits-get'  , elem.data('device') + ':' + elem.data('get'));
        elem.initData('limits-part' , elem.data('part'));
        elem.initData('substitution'    , '');

        // fill up colors to limits.length
        // if an index s isn't set, use the value of s-1
        for(var s=0; s<elem.data('limits').length; s++) {
            if(typeof elem.data('colors')[s] == 'undefined') {
                elem.data('colors')[s]=elem.data('colors')[s>0?s-1:0];
            }
        }

        elem.data('fix',            ( $.isNumeric(elem.data('fix')) ) ?  Number(elem.data('fix'))           : -1);

        elem.addReading('get');
        elem.addReading('limits-get');
        if ( elem.isDeviceReading('color') ) {elem.addReading('color');}

    },
    init: function () {
        this.elements = $('div[data-type="'+this.widgetname+'"]');
        this.elements.each(function(index) {
            widget_label.init_attr($(this));
        });
    },
    update_fix : function(value, fix) {
        return ( $.isNumeric(value) && fix>=0 ) ? Number(value).toFixed(fix) : value;
    },
    update_substitution : function(value, substitution) {
        DEBUG && console.log(this.widgetname,'value',value,'substitution',substitution);
        if(substitution){
            if (substitution.match(/^s/)) {
                var f = substitution.substr(1,1);
                var subst = substitution.split(f);
                return value.replace(new RegExp(subst[1],subst[3]), subst[2]);
            }
            else if (substitution.match(/weekdayshort/))
                  return dateFromString(value).ee();
            else if (substitution.match(/.*\(\)/))
                  return eval('value.'+substitution);
        }
        return value;
    },
    update_colorize : function(value, elem) {
        //set colors according matches for values
        var limits = elem.data('limits');
        var colors = elem.data('colors');
        if(limits && colors) {
            var idx=indexOfGeneric(limits,value);
            if (idx>-1) {
                elem.css( "color", getStyle('.'+colors[idx],'color') || colors[idx] );
            }
        }
    },
    update_cb : function(elem) {},
    update: function (dev,par) {
        var base = this;
        // update from normal state reading
        this.elements.filterDeviceReading('get',dev,par)
        .each(function(index) {
            var elem = $(this);
            var value = (elem.hasClass('timestamp'))
                        ?elem.getReading('get').date
                        :elem.getReading('get').val;
            if (value){
                var part = $(this).data('part');
                var val = getPart(value,part);
                var unit = $(this).data('unit');

                val = base.update_fix(val, $(this).data('fix'));
                val = base.update_substitution(val, $(this).data('substitution'));

                if ( ! $(this).hasClass('fixedlabel') ) {
                  if ( unit )
                    $(this).html( val + "<span class='label-unit'>"+unescape(unit)+"</span>" );
                  else
                    $(this).html(val);
                }
                base.update_cb($(this),val);
            }
            var color = elem.data('color');
            if (color && color.match(/#[a-fA-F0-9]{6}/))
                elem.css( "color", color );

        });

        //extra reading for dynamic color
        base.elements.filterDeviceReading('color',dev,par)
        .each(function(idx) {
            var elem = $(this);
            var val = elem.getReading('color').val;
            if(val) {
                val = '#'+val.replace('#','');
                elem.css( "color", val );
            }
            else
                elem.css( "color", getStyle('.'+elem.data('color'),'color') || elem.data('color') );
        });

        //extra reading for colorize
        base.elements.filterDeviceReading('limits-get',dev,par)
        .each(function(idx) {
            var elem = $(this);
            var val = elem.getReading('limits-get').val;
            if(val) {
                var part = elem.data('limits-part');
                var v = getPart(val,part);
                widget_label.update_colorize(v, elem);
            }
        });


    }
});
