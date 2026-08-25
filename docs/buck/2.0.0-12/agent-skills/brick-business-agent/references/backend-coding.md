# backend coding

Load this reference only when the current phase needs it. `SKILL.md` remains the hot entrypoint.

## Backend Coding Gate

Business backend code must use Lombok and MapStruct exactly as the Buck release bundle documents.

- Keep the backend Gradle dependencies for `org.projectlombok:lombok`, `org.mapstruct:mapstruct`, `org.mapstruct:mapstruct-processor`, and their `annotationProcessor` entries. Versions come from `buck-bom`; do not hard-code competing versions unless the release bundle says so.
- Keep Bean Validation available through `buck-starter-application` or `org.springframework.boot:spring-boot-starter-validation`. Controller `@RequestBody` parameters use `@Valid` / `@Validated`, and Request/Command/Query DTO fields use `jakarta.validation.constraints` for required, length, format, and range constraints.
- Spring components use constructor injection, preferably `@RequiredArgsConstructor` with `final` fields.
- Entity/DO classes use Lombok such as `@Getter`, `@Setter`, and `@Accessors(chain = true)`.
- Entity/DTO/Command/Response conversions use MapStruct with `@Mapper(componentModel = "spring")`; prefer extending `BrickDtoMapper<ENTITY, DTO>` from `core:api` when the conversion is a standard entity/DTO pair.
- MapStruct mapper files belong under `applet/<feature>/service/mapper`. MyBatis-Plus persistence mapper/repository code belongs under `repository`. Do not mix these boundaries.
- Controllers do not inject, extend, call, or return `BrickDtoMapper`, `service/mapper` MapStruct mappers, or repository Entity/DO types. Service owns the mapper dependency and returns contract types from the matching boundary `dto` package to the controller.
- HTTP contract types such as DTO, Command, Query, Request, Response, Page, and Detail belong under `applet/<feature>/dto` by default. When a module-level OpenAPI boundary is intentionally organized under root `openapi/`, its HTTP contract types may stay under `openapi/dto`; do not rewrite `com.example.openapi.dto` imports to `com.example.applet.openapi.dto`.
- API-facing temporal fields stay as strong Java time types such as `LocalDateTime`, `LocalDate`, `LocalTime`, or `Instant`; let Buck/core API serialization format them. Do not hand-convert them to `String` in controller/service/provider code or service/mapper MapStruct mappers with `DateTimeFormatter`, `SimpleDateFormat`, `temporal.toString()`, or `@Mapping(expression = "java(...toString())")`.
- Do not expose public nested DTO/Command/Query/Request/Response/Page/Detail records from service classes. Do not return `FaceXxxService.*`, service nested types inside generics, or any `.service` package type from controller public methods.
- When a feature has both `dto` and repository Entity/DO code, add a MapStruct mapper under `applet/<feature>/service/mapper`; it may extend `BrickDtoMapper`, but it must not live under `repository`. Do not write `toDetail(...)` setter mapping inside services.
- If the business rule check reports missing Lombok/MapStruct dependencies, mapper placement, or `componentModel = "spring"`, fix the business code or dependency setup. Do not bypass the rule.
