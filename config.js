$(document).ready(() => {
    console.log("Loaded project portal config")
    const prefix = ExternalModules.UWMadison.ProjectPortal.prefix
    const helperButtons = ExternalModules.UWMadison.ProjectPortal.helperButtons
    const url = window.location.href.split('/ExternalModules')[0]
    const $modal = $('#external-modules-configure-modal')
    $modal.on('show.bs.modal', (el) => {
        // Making sure we are overriding our modules's modal only.
        if ($(el.currentTarget).data('module') !== prefix) return

        if (typeof ExternalModules.Settings.prototype.resetConfigInstancesOld === 'undefined')
            ExternalModules.Settings.prototype.resetConfigInstancesOld = ExternalModules.Settings.prototype.resetConfigInstances

        ExternalModules.Settings.prototype.resetConfigInstances = function () {
            ExternalModules.Settings.prototype.resetConfigInstancesOld()
            if ($modal.data('module') !== prefix) return

            $modal.find(".external-modules-input-td").css('width', '250px')
            $modal.find('thead').remove()
            $modal.find("tr").not(".sub_start").find("span.external-modules-instance-label").remove()
            $modal.find(".sub_start td").css("background-color", "#eeeeee")

            // Make URL wide
            $modal.find("tr[field=destination]").each((_, el) => {
                let $tr = $(el)
                if ($tr.find('td').length == 3) {
                    $tr.find('td').first().remove()
                    let a = $tr.find('input').prop('name').split('____')[1]
                    $tr.find('td').first().attr('colspan', '2').prepend(
                        `<b>Destination URL:</b><br>
                        <span id="isRedcap___${a}">${url}</span><br>`
                    ).append(
                        `<span style="float:right" id="isRepeating___${a}">&instance=[new-instance]</span><br>
                        ${helperButtons}<br>
                        <span>Additional Pipes: Get a YMD formatted date with N offset using [today+N] and [today-N]</span><br>
                        <span style="margin-left:104px"> Get a YMD date with N working days offset using [work+N] </span><br>
                        <span style="margin-left:104px"> Event IDs can be piped via [eventname_arm_1] or [event-id] for the current event </span><br>
                        <span style="margin-left:104px"> The current URL can be piped via [current-url] </span>`
                    )
                    $tr.find('input').addClass("mt-1")
                }
            })

            // Default and branching logic in EMs doesn't work at time of writing
            // Hide values for redcap specific stuff
            $("input[name^=isredcap_]").on('click', (el) => {
                let $btn = $(el.currentTarget)
                let a = $btn.prop('name').split('____')[1]
                if ($btn.val() == "1") {
                    $(`input[name=isrepeating____${a}]`).closest('tr').show()
                    $(`#isRedcap___${a}`).show()
                    if ($(`input[name=isrepeating____${a}]:checked`).val() == "1")
                        $(`#isRepeating___${a}`).show()
                }
                else {
                    $(`input[name=isrepeating____${a}]`).closest('tr').hide()
                    $(`input[name=redcap-hide____${a}]`).closest('tr').hide()
                    $(`#isRedcap___${a}`).hide()
                    $(`#isRepeating___${a}`).hide()
                }
            })

            // Hide repeating instrument span
            $("input[name^=isrepeating_]").on('click', (el) => {
                let $btn = $(el.currentTarget)
                let a = $btn.prop('name').split('____')[1]
                if ($btn.val() == "1") {
                    $(`#isRepeating___${a}`).show()
                }
                else {
                    $(`#isRepeating___${a}`).hide()
                }
            })

            // Hide values for modal specific stuff
            $("input[name^=inmodal]").on('click', (el) => {
                let $btn = $(el.currentTarget)
                let a = $btn.prop('name').split('____')[1]
                if ($btn.val() == "1") {
                    $(`input[name=modal-height____${a}]`).closest('tr').show()
                    $(`input[name=modal-width____${a}]`).closest('tr').show()
                    $(`input[name=hide-close-button____${a}]`).closest('tr').show()
                    $(`input[name=redcap-hide____${a}]`).closest('tr').hide()
                    if ($(`input[name=isredcap____${a}]:checked`).val() == "1")
                        $(`input[name=redcap-hide____${a}]`).closest('tr').show()
                }
                else {
                    $(`input[name=modal-height____${a}]`).closest('tr').hide()
                    $(`input[name=modal-width____${a}]`).closest('tr').hide()
                    $(`input[name=redcap-hide____${a}]`).closest('tr').hide()
                    $(`input[name=hide-close-button____${a}]`).closest('tr').hide()
                }
            })

            // Default the radio value correctly
            $("input[name^=isredcap_]").each((index, el) => {
                if (index % 2 != 0) return
                if (!$(el).is(":checked") && !$(el).siblings("input").first().is(":checked")) {
                    $(el).click()
                    let a = $(el).prop('name').split('____')[1]
                    $(`input[name=isrepeating____${a}]`).first().click()
                    $(`input[name=redcap-hide____${a}]`).first().click()
                    $(`input[name=inmodal____${a}]`).first().click()
                }
            })
            $("input[type=radio]:checked").click()
        }
    })

    $modal.on('hide.bs.modal', (el) => {
        // Making sure we are overriding our modules's modal only.
        if ($(el.currentTarget).data('module') !== prefix) return
        if (typeof ExternalModules.Settings.prototype.resetConfigInstancesOld !== 'undefined')
            ExternalModules.Settings.prototype.resetConfigInstances = ExternalModules.Settings.prototype.resetConfigInstancesOld
    })
})