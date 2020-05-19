$(document).ready(function() {
    console.log("Loaded CTRI portal config")
    var pid = (new URLSearchParams(window.location.search)).get('pid');
    var url = window.location.href.split('/').slice(0,5).join('/');
    var $modal = $('#external-modules-configure-modal');
    $modal.on('show.bs.modal', function() {
        // Making sure we are overriding this modules's modal only.
        if ($(this).data('module') !== CTRIportal.modulePrefix)
            return;
    
        if (typeof ExternalModules.Settings.prototype.resetConfigInstancesOld === 'undefined')
            ExternalModules.Settings.prototype.resetConfigInstancesOld = ExternalModules.Settings.prototype.resetConfigInstances;

        ExternalModules.Settings.prototype.resetConfigInstances = function() {
            ExternalModules.Settings.prototype.resetConfigInstancesOld();

            if ($modal.data('module') !== CTRIportal.modulePrefix)
                return;
            
            $modal.addClass('CTRIportalConfig');
            $modal.find("tr[field=current-pid] input").val(pid).hide();
            $modal.find(".external-modules-input-td").css('width','250px');
            $modal.find('thead').remove();
            $modal.find("tr").not(".sub_start").find("span.external-modules-instance-label").remove();
            
            // Make URL wide
            $modal.find("tr[field=destination]").each( function() {
                if ( $(this).find('td').length == 3 ) {
                    $(this).find('td').first().remove();
                    let a = $(this).find('input').prop('name').split('____')[1];
                    $(this).find('td').first().attr('colspan','2').prepend(
                        `<b>Destination URL:</b><br>
                        <span id="isRedcap___${a}">${url}</span><br>`
                    ).append(
                        `<span style="float:right" id="isRepeating___${a}">&instance=[new-instance]</span><br>
                        ${CTRIportal.helperButtons}<br>
                        <span>Additional Pipes: Get a YMD formatted date with N offset using [today+N] and [today-N]</span><br>
                        <span style="margin-left:104px"> Event IDs can be piped via [eventname_arm_1] or [event-id] for the current event </span><br>
                        <span style="margin-left:104px"> The current URL can be piped via [current-url] </span>`
                    );
                    $(this).find('input').addClass("mt-1");
                }
            });
            
            // Default and branching logic in EMs doesn't work great at time of writing
            
            // Hide values for redcap specific stuff
            $("input[name^=isredcap_]").on('click', function() {
                let a = $(this).prop('name').split('____')[1];
                if ( $(this).val() == "1" ) {
                    $(`input[name=isrepeating____${a}]`).closest('tr').show();
                    $(`input[name=redcap-hide____${a}]`).closest('tr').show();
                    $(`#isRedcap___${a}`).show();
                    if ( $(`input[name=isrepeating____${a}]:checked`).val() == "1" )
                        $(`#isRepeating___${a}`).show();
                }
                else {
                    $(`input[name=isrepeating____${a}]`).closest('tr').hide();
                    $(`input[name=redcap-hide____${a}]`).closest('tr').hide();
                    $(`#isRedcap___${a}`).hide();
                    $(`#isRepeating___${a}`).hide();
                }
            });
            
            // Hide repeating instrument span
            $("input[name^=isrepeating_]").on('click', function() {
                let a = $(this).prop('name').split('____')[1];
                if ( $(this).val() == "1" ) {
                    $(`#isRepeating___${a}`).show();
                }
                else {
                    $(`#isRepeating___${a}`).hide();
                }
            });
            
            // Hide values for modal specific stuff
            $("input[name^=inmodal]").on('click', function() {
                let a = $(this).prop('name').split('____')[1];
                if ( $(this).val() == "1" ) {
                    $(`input[name=modal-height____${a}]`).closest('tr').show();
                    $(`input[name=modal-width____${a}]`).closest('tr').show();
                    $(`input[name=hide-close-button____${a}]`).closest('tr').show();
                    if ( $(`input[name=isredcap____${a}]:checked`).val() == "1" )
                        $(`input[name=redcap-hide____${a}]`).closest('tr').show();
                }
                else {
                    $(`input[name=modal-height____${a}]`).closest('tr').hide();
                    $(`input[name=modal-width____${a}]`).closest('tr').hide();
                    $(`input[name=redcap-hide____${a}]`).closest('tr').hide();
                    $(`input[name=hide-close-button____${a}]`).closest('tr').hide();
                }
            });
            
            // Default the radio value correctly
            $("input[name^=isredcap_]").each( function(index) {
                if ( index % 2 != 0 )
                    return;
                if ( !$(this).is(":checked") && !$(this).siblings("input").first().is(":checked") ){
                     $(this).click();
                     let a = $(this).prop('name').split('____')[1];
                     $(`input[name=isrepeating____${a}]`).first().click();
                     $(`input[name=redcap-hide____${a}]`).first().click();
                     $(`input[name=inmodal____${a}]`).first().click();
                }
            });
            $("input[type=radio]:checked").click();
        };
    });

    $modal.on('hide.bs.modal', function() {
        // Making sure we are overriding this modules's modal only.
        if ($(this).data('module') !== CTRIportal.modulePrefix)
            return;

        if (typeof ExternalModules.Settings.prototype.resetConfigInstancesOld !== 'undefined')
            ExternalModules.Settings.prototype.resetConfigInstances = ExternalModules.Settings.prototype.resetConfigInstancesOld;

        $modal.removeClass('CTRIportalConfig');
    });
});