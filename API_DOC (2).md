# 服务人员 API 文档(供前端使用)

> 后端为前端提供的公开 REST 接口,用于展示服务人员列表与详情。
> **所有接口无需登录鉴权**,前端可直接调用。

---

## 一、基础信息

| 项 | 值 |
|----|----|
| 接口 BaseURL | `https://3xrs6.com` 或 `https://jiusdai.eu.cc`(两个域名等价,任选) |
| 协议 | **HTTPS**(Let's Encrypt 证书,浏览器无警告,自动续期) |
| 数据格式 | JSON(UTF-8) |
| 鉴权 | 无(公开接口) |
| 跨域(CORS) | 已开启,`Access-Control-Allow-Origin: *`,支持浏览器跨域调用 |

> 经 Caddy 反向代理对外:`https://3xrs6.com` 的 `/api/*`、`/uploads/*` 路径会路由到 door 服务。
> 若前端与后端同域部署(前端也在 `3xrs6.com` 下),BaseURL 可省略,直接用相对路径(如 `/api/staff`)。

---

## 二、统一响应格式

所有接口返回如下 JSON 结构:

```json
{
  "code": 0,
  "msg": "ok",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | 业务状态码,`0` 表示成功,非 `0` 表示失败(见错误码表) |
| `msg`  | string | 状态描述 |
| `data` | object / array / 无 | 业务数据;失败时可能不存在 |

### 错误码表

| code | HTTP 状态码 | 含义 |
|------|------------|------|
| `0`   | 200 | 成功 |
| `400` | 400 | 请求参数错误(如 id 非法) |
| `404` | 404 | 资源不存在 |
| `405` | 405 | 请求方法不被允许 |
| `500` | 500 | 服务器内部错误 |

---

## 三、接口列表

| # | 方法 | 路径 | 说明 |
|---|------|------|------|
| 1 | GET | `/api/staff?active=1` | 服务人员列表 |
| 2 | GET | `/api/staff/{id}` | 单个人员详情 |
| 3 | GET | `/api/settings` | 全局设置(TRON 收款地址) |
| 4 | GET | `/api/staff/{id}/comments` | 某人员的评论列表 |
| 5 | GET | `/api/cities` | 城市列表(大洲/国家/城市) |

### 1. 获取服务人员列表

获取所有(或仅上架的)服务人员,按 id 倒序排列。

- **请求**
  - 方法:`GET`
  - 路径:`/api/staff`
  - 查询参数:

    | 参数 | 必填 | 说明 |
    |------|------|------|
    | `active` | 否 | `1` 时只返回上架(`isActive=true`)的人员;不传则返回全部 |

- **示例请求**

  ```http
  GET /api/staff?active=1 HTTP/1.1
  Host: 3xrs6.com
  ```

- **成功响应**

  ```json
  {
    "code": 0,
    "msg": "ok",
    "data": [
      {
        "id": 7,
        "name": "小美",
        "country": "中国",
        "city": "上海",
        "price": 500,
        "rating": 5,
        "age": 25,
        "height": 165,
        "size": "80-60-90",
        "bodyType": "苗条",
        "languages": "中文、英文",
        "preferences": "健身、音乐",
        "photoUrls": "",
        "isActive": true,
        "createdAt": "2026-07-20T10:30"
      },
      {
        "id": 6,
        "name": "小丽",
        "country": "中国",
        "city": "北京",
        "price": 400,
        "rating": 4,
        "age": 23,
        "height": 168,
        "size": "",
        "bodyType": "",
        "languages": "中文",
        "preferences": "",
        "photoUrls": "/uploads/xxx.jpg",
        "isActive": true,
        "createdAt": "2026-07-20T10:30"
      }
    ]
  }
  ```

- **说明**:列表页通常只需展示上架人员,建议前端固定带 `?active=1`。

---

### 2. 获取单个服务人员详情

- **请求**
  - 方法:`GET`
  - 路径:`/api/staff/{id}`
  - 路径参数:

    | 参数 | 类型 | 说明 |
    |------|------|------|
    | `id` | int | 人员 ID |

- **示例请求**

  ```http
  GET /api/staff/6 HTTP/1.1
  Host: 3xrs6.com
  ```

- **成功响应**

  ```json
  {
    "code": 0,
    "msg": "ok",
    "data": {
      "id": 6,
      "name": "小丽",
      "country": "中国",
      "city": "上海",
      "price": 500,
      "rating": 5,
      "age": 25,
      "height": 165,
      "size": "80-60-90",
      "bodyType": "苗条",
      "languages": "中文、英文",
      "preferences": "健身、音乐",
      "photoUrls": ["/uploads/aaa.jpg", "/uploads/bbb.jpg"],
      "isActive": true,
      "createdAt": "2026-07-20T10:30"
    }
  }
  ```

- **失败响应(人员不存在)**

  ```json
  { "code": 404, "msg": "not found" }
  ```

---

### 3. 获取全局设置(TRON 收款地址)

- **请求**
  - 方法:`GET`
  - 路径:`/api/settings`

- **示例请求**

  ```http
  GET /api/settings HTTP/1.1
  Host: 3xrs6.com
  ```

- **成功响应**

  ```json
  {
    "code": 0,
    "msg": "ok",
    "data": {
      "tronAddress": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
    }
  }
  ```

- **说明**:`tronAddress` 为管理后台维护的 TRON(TRC20)收款地址;**未设置时返回空字符串 `""`**。前端可用于展示收款地址/二维码。

---

### 4. 获取服务人员的评论

- **请求**
  - 方法:`GET`
  - 路径:`/api/staff/{id}/comments`

- **示例请求**

  ```http
  GET /api/staff/6/comments HTTP/1.1
  Host: 3xrs6.com
  ```

- **成功响应**

  ```json
  {
    "code": 0,
    "msg": "ok",
    "data": [
      {
        "id": 12,
        "author": "张女士",
        "content": "服务很好,准时上门,态度专业。",
        "createdAt": "2026-07-20T10:30"
      }
    ]
  }
  ```

- **说明**:返回指定人员的评论列表(按时间倒序),无评论时 `data` 为空数组 `[]`;人员不存在返回 `{code:404}`。

  字段说明(评论对象):
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `id` | int | 评论 ID |
  | `author` | string | 评论者名 |
  | `content` | string | 评论内容 |
  | `createdAt` | string | 评论时间,格式 `YYYY-MM-DDTHH:MM` |

---

### 5. 获取城市列表

- **请求**
  - 方法:`GET`
  - 路径:`/api/cities`

- **示例请求**

  ```http
  GET /api/cities HTTP/1.1
  Host: 3xrs6.com
  ```

- **成功响应**

  ```json
  {
    "code": 0,
    "msg": "ok",
    "data": [
      {
        "id": 1,
        "continent": "亚洲",
        "country": "中国",
        "city": "上海",
        "createdAt": "2026-07-20T10:30"
      }
    ]
  }
  ```

- **说明**:返回后台维护的全部城市记录(按时间倒序),无记录时 `data` 为空数组 `[]`。

  字段说明(城市对象):
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `id` | int | 城市 ID |
  | `continent` | string | 大洲,可能为空字符串 `""` |
  | `country` | string | 国家,可能为空字符串 `""` |
  | `city` | string | 城市名 |
  | `createdAt` | string | 添加时间,格式 `YYYY-MM-DDTHH:MM` |

---

### 6. 用户注册

- **请求**:`POST /api/auth/register`,body `{"email":"x@y.com","password":"abc123"}`(密码至少 6 位)
- **成功**:`{"code":0,"msg":"ok","data":{"token":"...","user":{...}}}`(注册即登录,直接返回 token)
- **邮箱已注册**:`{"code":409,"msg":"该邮箱已注册"}`

### 7. 用户登录

- **请求**:`POST /api/auth/login`,body `{"email","password"}`
- **成功**:同上 `{token, user}`;**密码错**:`{"code":401,"msg":"邮箱或密码错误"}`
- 不需要邮箱验证,注册即可用。

### 8. 当前用户 / 登出(需登录)

请求头带 `Authorization: Bearer <token>`(登录/注册返回的 token)。

- `GET /api/auth/me` → `{"code":0,"data":{"id":1,"email":"...","createdAt":"..."}}`
- `POST /api/auth/logout` → `{"code":0,"msg":"ok"}`(注销当前 token)
- **未带/失效 token**:`{"code":401,"msg":"未登录"}`

> `user` 对象字段:`id`(int)、`email`(string)、`createdAt`(string,`YYYY-MM-DDTHH:MM`)。token 有效期 30 天,前端请保存在本地并在需登录的请求头带上 `Authorization: Bearer <token>`。

---

## 四、数据对象:`Staff`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 人员唯一 ID |
| `name` | string | 姓名 |
| `country` | string | 国家,可能为空字符串 `""` |
| `city` | string | 城市,可能为空字符串 `""` |
| `price` | number | 价格(元),保留两位小数,如 `120.5`、`80` |
| `rating` | int | 评分,0-5,`0` 表示未评 |
| `age` | int | 年龄,`0` 表示未填 |
| `height` | number | 身高(cm),`0` 表示未填 |
| `size` | string | 尺寸,可能为空字符串 `""` |
| `bodyType` | string | 体型,可能为空字符串 `""` |
| `languages` | string | 语言能力,可能为空字符串 `""` |
| `preferences` | string | 喜好,可能为空字符串 `""` |
| `photoUrls` | string[] | 照片 URL 数组(**相对路径**,如 `/uploads/xxx.jpg`),无图时为 `[]` |
| `isActive` | bool | 上架状态,`true`=上架、`false`=下架 |
| `createdAt` | string | 创建时间,格式 `YYYY-MM-DDTHH:MM` |

### ⚠️ photoUrls 使用说明(重要)

接口返回的 `photoUrls` 是**相对路径**(以 `/uploads/` 开头),前端需要**拼接 BaseURL** 才能访问到图片:

```js
const fullUrl = item.photoUrls ? `https://3xrs6.com${item.photoUrls}` : '';
```

示例:
- 返回 `photoUrls: "/uploads/1781619288872985372-1bea4bc1.jpg"`
- 完整图片地址:`https://3xrs6.com/uploads/1781619288872985372-1bea4bc1.jpg`

前端渲染:

```html
<img :src="fullUrl" alt="" v-if="fullUrl" />
```

---

## 五、前端调用示例

### 原生 fetch(列表)

```js
const BASE = 'https://3xrs6.com';

async function loadStaff() {
  const res = await fetch(`${BASE}/api/staff?active=1`);
  const json = await res.json();
  if (json.code === 0) {
    const list = json.data;
    list.forEach(item => {
      const photo = item.photoUrls ? `${BASE}${item.photoUrls}` : '';
      // rating=0 表示未评;age/height=0 表示未填;字符串字段可能为空 ""
      console.log(item.name, item.country, item.city, item.price,
                  item.rating, item.age, item.height, item.size,
                  item.bodyType, item.languages, item.preferences, photo);
    });
  }
}
```

### axios(详情)

```js
import axios from 'axios';
const api = axios.create({ baseURL: 'https://3xrs6.com' });

async function getDetail(id) {
  const { data } = await api.get(`/api/staff/${id}`);
  if (data.code === 0) {
    return data.data;  // Staff 对象
  }
  throw new Error(data.msg);
}
```

---

## 六、联系与说明

- **接口变更**:如需新增字段(如分类、评分)、搜索、分页等,请联系后端扩展。
- **数据来源**:服务人员资料由管理后台(`https://3xrs6.com`)维护。
- **HTTP 跳转**:用 `http://3xrs6.com` 访问会自动 301/308 跳转到 HTTPS,前端建议直接用 `https://3xrs6.com`。
- **建议**:`BaseURL` 在前端用环境变量管理(如 `VITE_API_BASE`),便于切换环境。
