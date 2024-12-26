# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### CloudDuck <a name="CloudDuck" id="cloud-duck.CloudDuck"></a>

The CloudDuck construct.

This construct creates a serverless analysis environment using DuckDB for S3 data

#### Initializers <a name="Initializers" id="cloud-duck.CloudDuck.Initializer"></a>

```typescript
import { CloudDuck } from 'cloud-duck'

new CloudDuck(scope: Construct, id: string, props?: CloudDuckProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cloud-duck.CloudDuck.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cloud-duck.CloudDuck.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cloud-duck.CloudDuck.Initializer.parameter.props">props</a></code> | <code><a href="#cloud-duck.CloudDuckProps">CloudDuckProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cloud-duck.CloudDuck.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cloud-duck.CloudDuck.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Optional</sup> <a name="props" id="cloud-duck.CloudDuck.Initializer.parameter.props"></a>

- *Type:* <a href="#cloud-duck.CloudDuckProps">CloudDuckProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cloud-duck.CloudDuck.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cloud-duck.CloudDuck.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cloud-duck.CloudDuck.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cloud-duck.CloudDuck.isConstruct"></a>

```typescript
import { CloudDuck } from 'cloud-duck'

CloudDuck.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cloud-duck.CloudDuck.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cloud-duck.CloudDuck.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |

---

##### `node`<sup>Required</sup> <a name="node" id="cloud-duck.CloudDuck.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---


## Structs <a name="Structs" id="Structs"></a>

### CloudDuckProps <a name="CloudDuckProps" id="cloud-duck.CloudDuckProps"></a>

Props for the CloudDuck construct.

#### Initializer <a name="Initializer" id="cloud-duck.CloudDuckProps.Initializer"></a>

```typescript
import { CloudDuckProps } from 'cloud-duck'

const cloudDuckProps: CloudDuckProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cloud-duck.CloudDuckProps.property.memory">memory</a></code> | <code>aws-cdk-lib.Size</code> | The amount of memory to allocate to the Lambda function. |
| <code><a href="#cloud-duck.CloudDuckProps.property.targetBuckets">targetBuckets</a></code> | <code>aws-cdk-lib.aws_s3.Bucket[]</code> | The S3 buckets which the cloud duck will analyze. |

---

##### `memory`<sup>Optional</sup> <a name="memory" id="cloud-duck.CloudDuckProps.property.memory"></a>

```typescript
public readonly memory: Size;
```

- *Type:* aws-cdk-lib.Size
- *Default:* 1024 MiB

The amount of memory to allocate to the Lambda function.

---

##### `targetBuckets`<sup>Optional</sup> <a name="targetBuckets" id="cloud-duck.CloudDuckProps.property.targetBuckets"></a>

```typescript
public readonly targetBuckets: Bucket[];
```

- *Type:* aws-cdk-lib.aws_s3.Bucket[]
- *Default:* All buckets in the account

The S3 buckets which the cloud duck will analyze.

---



