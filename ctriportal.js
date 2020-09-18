CTRIportal.html = {};

CTRIportal.html.modal = `
<div id="modalID" class="modal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close refresh" style="font-size:1.4rem">
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
            return;
        }
        
        if ( CTRIportal.insideModal ) {
            require_change_reason = 0; // Stop that pop-up from happening
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
            $(this).find('.modal-content').css('min-height', parseCSSportalSetting(info.height,'h'));
            $(this).find('.modal-dialog').css('max-width', parseCSSportalSetting(info.width,'w'));

            if ( $(this).find('iframe').length != 0)
                return;
            
            $(this).find('.refresh').on('click', function() {
                $(`#${name} iframe`).get(0).contentWindow.location.reload();
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
        val = parseInt(input.match(/(?:today){1}([+-][1-9])+/g)[0].split("today")[1]); // ?: isn't non-capture?
        input = input.replace(/\[(today){1}([+-][1-9])+\]/g,getOffsetDate(val))
    }
    input = input.replace("[current-url]",encodeURIComponent(window.location.href));
    input = input.replace("[event-id]",getParameterByName("event_id")); //Redcap JS function
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

function getOffsetDate( offset ) {
    let d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${padDigitLen2(d.getMonth()+1)}-${padDigitLen2(d.getDate())}`;
}

function padDigitLen2(number) {
    return ('0'+number).substr(-2);
}