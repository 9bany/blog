---
title: Debugger hoạt động thế nào ? 
author: rony
publish_date: 2023-01-03T00:00:00.000Z
abstract: Chui vào xem sao =)) 
---

## Ta có thể làm gì với debugger?

- Chạy một chương trình, xem chương trình đi từ đoạn `code` nào đến đoạn `code` nào.
- Đặt `breakpoint` và có thể xem giá trị của những biến tại nơi đặt `breakpoint`.
- Thực thi một biểu thức hay gọi `functions` trong quá trình `debug`.
- Thay đổi `process's code on-the-fly` và quan sát kết qủa.

Tools hổ trợ debug.
- Go: [delve](https://github.com/go-delve/delve)
- Rust: [rust-analyzer](https://github.com/rust-lang/rust-analyzer)

Về cơ bản thì debugger đã hoạt động ra sao ?

## Linux - `ptraces`

>  Ví dụ dưới đây được base trên linux 32bit. chỉ có thể chạy trên linux 32

[Small matter of programming](https://en.wikipedia.org/wiki/Small_matter_of_programming)