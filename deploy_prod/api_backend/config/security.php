<?php

return [
    'hsts'                         => true,
    'hsts_max_age'                 => 31536000,
    'frame_options'                => 'DENY',
    'content_type_options'         => 'nosniff',
    'referrer_policy'              => 'strict-origin-when-cross-origin',
    'cross_origin_opener_policy'   => 'same-origin',
    'cross_origin_resource_policy' => 'same-origin',
    'origin_agent_cluster'         => '?1',
    'permitted_cross_domain'       => 'none',
    'csp'                          => "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
];
