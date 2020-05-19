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
    $.each( CTRIportal.config, function(name, info) {
        if ( $(`.${name}`).length == 0 )
            return;
        
        info.url = customPipes( info.url );
        
        if ( !info.modal ) {
            $(`.${name}`).on('click', function() {
                window.location.href = info.url;
            });
            return;
        }
        
        if ( CTRIportal.insideModal ) {
            //Not doing anything right now. 
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
            
            $(this).find('.modal-body').append(CTRIportal.html.iframe.replace('LINK',info.url));
                       
            $(this).find('iframe').on('load', function() {
                let content = $(this).contents();
                if ($(content).find("#header").text() == "Server Error")
                    return;
                if (info.hide == 'all') {
                    $(content).find('body > :not(form)').not('.ui-dialog').hide();
                    $(content).find('form').appendTo($(content).find('body'));
                    $(content).find('tr[id$=__-tr]').hide();
                } else if (info.hide == 'nav') {
                     $(content).find("#west, #south, #subheader, #fade").remove();
                }
                
                if( ($(content).find('#field_validation_error_state').length!=0 && 
                     $(content).find('#field_validation_error_state').val()!="0") || 
                    $(content).find("#dq_rules_violated").length != 0 ||
                    ($(content).find("#reqPopup").length != 0 && $(content).find("#reqPopup").is(':data(dialog)'))) {
                    Swal.fire({
                      icon: 'info',
                      title: 'Issue saving form!',
                      text: 'Please re-open the modal and address any issues.',
                    });
                }
                
                $(`#${name} .iframeLoading`).hide();
                $(this).show();
            });
            
            $(this).find('.saveButton').on('click', function() {
                $(`#${name}`).modal('hide');
                let content = $(`#${name} iframe`).contents();
                if ( $(content).find("#saveButton, .saveButton").not('.modal #saveButton, .modal .saveButton').length != 0 ) {
                    $(`#${name} iframe`).get(0).contentWindow.jQuery("#saveButton, .saveButton").not('.modal #saveButton, .modal .saveButton').click()
                } else {
                    $(content).find("#submit-btn-savecontinue").click();
                }
            });
            
            $(this).find('.refresh').on('click', function() {
                $(`#${name} iframe`).get(0).contentWindow.location.reload();
            });
        });
    });
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