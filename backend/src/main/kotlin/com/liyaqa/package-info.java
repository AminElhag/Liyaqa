@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "tenantId", type = java.util.UUID.class)
)
@FilterDef(
    name = "organizationFilter",
    parameters = @ParamDef(name = "organizationId", type = java.util.UUID.class)
)
package com.liyaqa;

import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.FilterDefs;
import org.hibernate.annotations.ParamDef;
