<?php

namespace UWMadison\ProjectPortal;

use ExternalModules\AbstractExternalModule;
use REDCap;
use Piping;
use RCView;

class ProjectPortal extends AbstractExternalModule
{

    private $module_global = 'ProjectPortal';

    public function redcap_every_page_top($project_id)
    {
        // Custom Config page
        if ($this->isPage('ExternalModules/manager/project.php') && $project_id != NULL) {
            $this->initGlobal();
            $this->passArgument('helperButtons', $this->getPipingHelperButtons());
            $this->includeJs('config.js');
        }
    }

    public function redcap_data_entry_form($project_id, $record, $instrument, $event_id, $group_id, $repeat_instance)
    {
        $this->initGlobal();
        $config = $this->parseConfiguration([
            'project' => $project_id,
            'record' => $record,
            'event' => $event_id,
            'instance' => $repeat_instance,
        ]);
        $this->passArgument('backgroundScroll', $this->getProjectSetting('background-scroll'));
        $this->passArgument('config', $config);
        $this->includeJs('portal.js');
    }

    private function initGlobal()
    {
        $data = json_encode([
            "modulePrefix" => $this->getPrefix(),
        ]);
        echo "<script>var {$this->module_global} = {$data};</script>";
    }

    private function passArgument($name, $value)
    {
        echo "<script>{$this->module_global}.{$name} = " . json_encode($value) . ";</script>";
    }

    private function includeJs($path)
    {
        echo "<script src={$this->getUrl($path)}></script>";
    }

    private function parseConfiguration($common)
    {
        $settings = $this->getProjectSettings();
        $load = [];
        foreach ($settings['name'] as $index => $name) {
            if (empty($name)) {
                continue;
            }
            $url = $settings['destination'][$index];
            $url = str_replace('[event-id]', $_GET['event_id'], $url);
            if ($settings['isredcap'][$index] == "1") {
                if (Piping::containsSpecialTags($url)) {
                    $url = Piping::pipeSpecialTags($url, $common['project'], $common['record'], $common['event'], $common['instance']);
                }
                if (preg_match('/\[.*\]/', $url, $matches)) {
                    foreach ($matches as $match) {
                        $event_id = REDCap::getEventIdFromUniqueEvent(trim($match, '[]'));
                        if ($event_id)
                            $url = str_replace($match, $event_id, $url);
                    }
                }
                $url = 'https://' . $_SERVER['HTTP_HOST'] . '/redcap/redcap_v' . REDCAP_VERSION . $url;
                if ($settings['isrepeating'][$index] == "1") {
                    $url_components = parse_url($url);
                    parse_str($url_components['query'], $params);
                    $instance = 0;
                    if (!empty($params['id'])) {
                        $data = REDCap::getData($params['pid'], 'array', $params['id']);
                        $instance = (int)end(array_keys($data[$params['id']]['repeat_instances'][$params['event_id']][$params['page']]));
                    }
                    $url = $url . '&instance=' . ($instance + 1);
                }
            }
            $load[$name] = [
                'url' => $url,
                'width' => $settings['modal-width'][$index],
                'height' => $settings['modal-height'][$index],
                'modal' => $settings['inmodal'][$index] == 1,
                'hide' => $settings['redcap-hide'][$index],
                'hideClose' => $settings['hide-close-button'][$index]
            ];
        }
        return $load;
    }

    private function getPipingHelperButtons()
    {
        global $lang;
        $buttons = array(
            'green' => array(
                'callback' => 'smartVariableExplainPopup',
                'contents' => '[<i class="fas fa-bolt fa-xs"></i>] ' . $lang['global_146'],
            ),
            'purple' => array(
                'callback' => 'pipingExplanation',
                'contents' => RCView::img(array('src' => APP_PATH_IMAGES . 'pipe.png')) . $lang['info_41'],
            ),
        );
        $output = '';
        foreach ($buttons as $color => $btn) {
            $output .= RCView::button(array('class' => 'btn btn-xs btn-rc' . $color . ' btn-rc' . $color . '-light', 'onclick' => $btn['callback'] . '(); return false;'), $btn['contents']);
        }
        return RCView::br() . RCView::span(array('class' => 'project-portal-piping-helper'), $output);
    }
}
