package com.liyaqa.platform.content.exception

import com.liyaqa.platform.exception.*
import java.util.UUID

class ArticleNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.ARTICLE_NOT_FOUND, "Knowledge base article not found: $id")

class ArticleNotFoundBySlugException(slug: String) :
    PlatformResourceNotFoundException(PlatformErrorCode.ARTICLE_NOT_FOUND, "Knowledge base article not found with slug: $slug")

class DuplicateSlugException(slug: String) :
    PlatformDuplicateResourceException(PlatformErrorCode.DUPLICATE_SLUG, "Article slug already exists: $slug")

class TemplateNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.CONTENT_TEMPLATE_NOT_FOUND, "Document template not found: $id")

class TemplateNotFoundByKeyException(key: String) :
    PlatformResourceNotFoundException(PlatformErrorCode.CONTENT_TEMPLATE_NOT_FOUND, "Document template not found with key: $key")

class DuplicateTemplateKeyException(key: String) :
    PlatformDuplicateResourceException(PlatformErrorCode.DUPLICATE_TEMPLATE_KEY, "Template key already exists: $key")

class TemplateRenderException(message: String, cause: Throwable? = null) :
    PlatformInvalidStateException(PlatformErrorCode.TEMPLATE_RENDER_ERROR, message, cause)
