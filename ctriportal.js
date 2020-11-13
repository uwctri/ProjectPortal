CTRIportal.html = {};

CTRIportal.html.modal = `
<div id="modalID" class="modal pr-0" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close fullscreen" style="font-size:1.3rem" data-toggle="false">
                    <span>&#x26F6;</span>
                </button>
                <button type="button" class="close refresh ml-0" style="font-size:1.3rem">
                    <span>&#8635;</span>
                </button>
                <button type="button" class="close ml-0" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="padding:0;display:flex;justify-content:center;">
                <div class="iframeLoading" style="align-self:center;color:grey;font-size:16px;">Loading...</div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-success saveButton">Save & Close</button>
            </div>
        </div>
    </div>
</div>
`;

CTRIportal.html.tr = `
<tr id="ctriPortal-tr" sq_id="ctriPortal">
    <td class="labelrc col-12" colspan="2" style="padding:0;border:0">
    </td>
</tr>
`;

CTRIportal.html.iframe = `
    <iframe style="display:none;width:100%;border:none" src="LINK"></iframe>
`;

Date.prototype.addDays = function (days) {
    return new Date( this.setDate(this.getDate() + days) );
}

Date.prototype.addWorkDays = function (days) {
    return new Date( this.setDate(this.getDate() + days + (this.getDay() === 6 ? 2 : +!this.getDay()) +
        (Math.floor((days - 1 + (this.getDay() % 6 || 1)) / 5) * 2)) );
}

Date.prototype.ymd = function() {
    return formatDate(this, 'y-MM-dd');
}

$(document).ready(function () {
    $('form tr').last().after(CTRIportal.html.tr);
    if ( CTRIportal.wrongProject ) {
        Swal.fire({
            icon: 'error',
            title: 'Old configuration for CTRI Portal!',
            text: 'Modal links appear to have been set in a differant project. Please ask an admin to review the project settings.',
        });    
    }
    
    CTRIportal.insideModal = window.self !== window.top;
    
    if (typeof Shazam == "object") { 
        let oldCallback = Shazam.beforeDisplayCallback;
        Shazam.beforeDisplayCallback = function () {
            if (typeof oldCallback == "function") 
                oldCallback();
            loadPortals();
        }
        setTimeout(loadPortals, 1000);
    }
    else 
        loadPortals();
});

function loadPortals() {
    if ( CTRIportal.loaded )
        return;
    CTRIportal.loaded = true;
    
    // Prevent google chrome bug with hidden forms
    $(window).bind('beforeunload', function(){
        if($('.modal').is(':visible') === false)
            $( ".modal" ).remove();
    });
    
    $.each( CTRIportal.config, function(name, info) {
        if ( $(`.${name}`).length == 0 )
            return;
        
        $(`.${name}`).off(); // Remove all Redcap events
        
        info.url = customPipes( info.url );
        
        if ( !info.modal ) {
            $(`.${name}`).attr('href', info.url);
            $(`.${name}`).on('click', function() {
                window.location = $(this).attr('href');
            });
            return;
        }
        
        if ( CTRIportal.insideModal ) { // Stop that pop-up from happening
            require_change_reason = 0;  // but doesn't solve saving issue
        }
        
        $("#ctriPortal-tr td").append(CTRIportal.html.modal.replace('modalID', name));
        if ( info.hideClose )
            $(`#${name} .btn-danger`).hide();
        $(`#${name}`).modal({
            show: false,
            backdrop: 'static'
        });
        
        
        $(`.${name}`).on('click', function() {
            $(`#${name}`).modal('show');
        });
        
        $(`#${name}`).on('shown.bs.modal', function() {
            if ( CTRIportal.backgroundScroll )
                $(".modal-open").css("overflow-y",'auto');
        });
        
        $(`#${name}`).on('show.bs.modal', function() {
            $(this).find('.modal-dialog').css('max-width', parseCSSportalSetting(info.width,'w'));
            $(window).on('resize', function(){
                let t = $(`#${name} .fullscreen`).data('toggle');
                let h = t ? window.innerHeight : parseCSSportalSetting(info.height,'h');
                $(`#${name} .modal-dialog`).css('margin-top', t ? 0 : '1.75rem');
                $(`#${name} .modal-dialog`).css('margin-bottom', t ? 0 : '1.75rem');
                $(`#${name} .modal-content`).css('height', h);
            });
            $(window).resize();
            
            if ( $(this).find('iframe').length != 0)
                return;
            
            $(this).find('.refresh').on('click', function() {
                $(`#${name} iframe`).get(0).contentWindow.location.reload();
            });
            
            $(this).find('.fullscreen').on('click', function() {
                let t = $(`#${name} .fullscreen`).data('toggle');
                $(`#${name} .fullscreen`).data('toggle', !t);
                if ( t ) {
                    CTRIportal.width = $(`#${name} .modal-dialog`).width()
                    if ( info.hide != 'all' )//Only change width if we aren't showing a normal form
                        $(`#${name} .modal-dialog`).css('max-width', window.innerWidth);
                } else {
                    $(`#${name} .modal-dialog`).css('max-width', parseCSSportalSetting(info.width,'w'));
                }
                $(`#${name} .modal-dialog`).css('width', t ? 'auto' : CTRIportal.width);
                $(window).resize();
            });
            
            $(this).find('.modal-body').append(CTRIportal.html.iframe.replace('LINK',info.url));
                       
            $(this).find('iframe').on('load', function() {
                let content = $(this).contents();
                if ($(content).find("#header").text() == "Server Error")
                    return;
                if (info.hide == 'all') {
                    $(content).find('body > :not(#form)').not('.ui-dialog').hide();
                    $(content).find('#form').appendTo($(content).find('body'));
                    $(content).find('tr[id$=__-tr]').hide();
                    $(content).find('html').css('overflow-x','hidden');
                } else if (info.hide == 'nav') {
                     $(content).find("#west, #south, #subheader, #fade").remove();
                }
                $(`#${name} .iframeLoading`).hide();
                $(this).show();
                enableRedcapSaveButtons();
            });
            
            $(this).find('.saveButton').on('click', function() {
                let content = $(`#${name} iframe`).contents();
                
                // Check for required feilds
                let reqFieldMissing = false;
                $(content).find('*[req]:visible').each(function() {
                    if ( reqFieldMissing )
                        return false;
                    let $input = $(this).find('select,input,textarea');
                    if ( $input.length == 1 ) // Select, input, or textarea 
                        reqFieldMissing = $input.val() == "";
                    else // checkbox
                        reqFieldMissing = $input.not('*[id]').get().map(x=>x.value).every(x=>!x);
                });
                if ( reqFieldMissing ) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Missing Required Fields',
                        text: 'You did not provide a value for some fields that require a value. Please enter a value for the fields marked as required on this page.',
                    });   
                    return;
                }
                
                disableRedcapSaveButtons();
                $(`#${name}`).modal('hide');
                if ( $(content).find("#saveButton, .saveButton").not('.modal #saveButton, .modal .saveButton').length != 0 ) {
                    $(`#${name} iframe`).get(0).contentWindow.jQuery("#saveButton, .saveButton").not('.modal #saveButton, .modal .saveButton').click();
                } else {
                    $(content).find("#submit-btn-savecontinue").click();
                }
            });
        });
    });
}

function enableRedcapSaveButtons() {
    $("#__SUBMITBUTTONS__-tr button").css('pointer-events', '');
    $(".modalTempDisableSave").last().remove();
}

function disableRedcapSaveButtons() {
    $("#__SUBMITBUTTONS__-tr button").css('pointer-events', 'none');
    if ( $(".modalTempDisableSave").length > 0 )
        $("#questiontable").after(`<div class='modalTempDisableSave d-none'></div>`)
    else
        $("#__SUBMITBUTTONS__-tr button").last().after(`<span class='text-bold text-danger modalTempDisableSave'><br>* Form saving disabled while modal is saved</span>`)
    setTimeout(enableRedcapSaveButtons, 3000);
}

function customPipes( input ) {
    let val;
    if ( input.includes("[today") ) {
        val = input.match(/(?:today){1}([+-]([1-9]*))+/g);
        val = parseInt((val?val:["today+0"])[0].split("today")[1]); // ?: isn't non-capture?
        input = input.replace(/\[(today){1}([+-][1-9])+\]/g,(new Date()).addDays(val).ymd())
    }
    if ( input.includes("[work") ) {
        val = input.match(/(?:work){1}([+-]([1-9]*))+/g);
        val = parseInt((val?val:["work+0"])[0].split("work")[1]);
        input = input.replace(/\[(work){1}([+-][1-9])+\]/g,(new Date()).addWorkDays(val).ymd())
    }
    input = input.replace("[current-url]",encodeURIComponent(window.location.href));
    return input;
}

function parseCSSportalSetting( setting, hw ) {
    if (!setting && hw=='h')
        return window.innerHeight*.9;
    if (!setting && hw=='w')
        return '800px';
    if ( setting.includes('%') && hw=='h' )
        return window.innerHeight* (parseInt(setting.replace('%',''))/100);
    if ( setting.includes('%') && hw=='w' )
        return window.innerWidth* (parseInt(setting.replace('%',''))/100);
    return setting;
}