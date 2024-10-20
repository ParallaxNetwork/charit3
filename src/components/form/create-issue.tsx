"use client"

import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { zIssue, categories } from "@/server/schema/issue"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Types } from "mongoose"
import { api } from "@/trpc/react"

import Image from "next/image"
import { LuMoveLeft, LuImagePlus } from "react-icons/lu"
import { Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dropzone } from "@/components/ui/dropzone"
import { SortableGrid, SortableGridItem } from "@/components/ui/sortable-grid"

const zIssueForm = zIssue
  .omit({
    _id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    gallery: z
      .array(z.object({ url: z.string() }))
      .max(6)
      .optional(),
  })

const CreateIssueFormContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { mutateAsync: createIssue, isPending: isCreatingIssue } =
    api.issue.create.useMutation()

  const form = useForm<z.infer<typeof zIssueForm>>({
    resolver: zodResolver(zIssueForm),
    mode: "all",
    defaultValues: {
      thumbnail: undefined,
      name: "",
      category: undefined,
      description: "",
      gallery: [],
      creator: new Types.ObjectId(session?.user?.id),
    },
  })

  const gallery = useFieldArray({
    control: form.control,
    name: "gallery",
  })

  function onSubmit(values: z.infer<typeof zIssueForm>) {
    console.log("submit")
    console.log("values", values)

    const createData = {
      ...values,
      creator: new Types.ObjectId(session?.user?.id),
      gallery: values.gallery?.map((item) => item.url) ?? [],
    }

    console.log("createData", createData)

    toast.promise(createIssue(createData), {
      loading: "Creating issue...",
      success: () => {
        router.push("/home")
        form.reset()
        return "Issue created successfully"
      },
      error: (error) => {
        return `Failed to create issue: ${error.message}`
      },
    })
  }

  useEffect(() => {
    console.log("session", session)
    console.log("form errors:", form.formState.errors)
  }, [form, session])

  return (
    <div className="container">
      <div className="relative border-b border-dark/20 px-4 py-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            router.push(searchParams.get("from") ?? "/home")
          }}
          className="absolute"
        >
          <LuMoveLeft className="text-2xl" />
        </Button>
        <p className="text-center text-2xl font-bold text-dark">Create Issue</p>
      </div>
      <div className="px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-dark">
                    Thumbnail Image (ratio 3:4)
                  </FormLabel>
                  <FormControl>
                    {!field.value ? (
                      <Dropzone
                        onChange={field.onChange}
                        className="aspect-[3/4] w-full bg-shade-white"
                        extensions={["png", "jpg", "jpeg"]}
                        maxSize={1000 * 1024} // in Kilobytes
                        multiple={false}
                      />
                    ) : (
                      <div className="border-input group relative aspect-[3/4] w-full overflow-hidden rounded-md border bg-shade-white">
                        <Image
                          src={field.value}
                          alt=""
                          fill={true}
                          sizes="100%"
                          className="object-cover object-center"
                        />
                        <div className="bg-foreground/40 absolute inset-0 hidden items-center justify-center group-hover:flex">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => field.onChange(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-dark">
                    Issue Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Input issue name"
                      className=""
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Select Category Topic</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {categories.map((topic, i) => (
                        <FormItem
                          key={i}
                          className="flex items-center space-y-0"
                        >
                          <FormControl>
                            <RadioGroupItem value={topic} className="hidden" />
                          </FormControl>
                          <FormLabel className="w-full">
                            <div
                              className={cn(
                                "rounded-lg bg-shade-white px-3 py-3.5 text-center font-medium text-dark",
                                {
                                  "border border-blue bg-blue/10 text-blue":
                                    field.value === topic,
                                },
                              )}
                            >
                              {topic}
                            </div>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-dark">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Input Description"
                      className=""
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck="false"
                      rows={12}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Gallery</FormLabel>
              <SortableGrid
                id="event-gallery"
                value={gallery.fields}
                onMove={({ activeIndex, overIndex }) =>
                  gallery.move(activeIndex, overIndex)
                }
              >
                <div className="grid w-full grid-flow-row grid-cols-3 gap-2">
                  {gallery.fields.map((field, index) => (
                    <SortableGridItem key={field.id} value={field.id} asChild>
                      <div className="border-input group relative aspect-square cursor-grab overflow-hidden rounded-md border bg-shade-white">
                        <Image
                          src={field.url}
                          alt=""
                          fill={true}
                          sizes="100%"
                          className="object-contain object-center"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => gallery.remove(index)}
                          className="absolute right-1 top-1 hidden group-hover:flex"
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </SortableGridItem>
                  ))}

                  {gallery.fields.length < 6 && (
                    <Dropzone
                      onChange={(value) =>
                        gallery.append({ url: value as string })
                      }
                      className="aspect-square bg-shade-white"
                      extensions={["png", "jpg", "jpeg"]}
                      maxSize={750 * 1024} // in Kilobytes
                      multiple={false}
                      droppable={false}
                    >
                      <div className="flex flex-col items-center">
                        <LuImagePlus className="text-xl" />
                        <p className="pl-2.5 font-medium">Add image</p>
                      </div>
                    </Dropzone>
                  )}
                </div>
              </SortableGrid>
            </FormItem>
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={isCreatingIssue || !form.formState.isValid || !session}
            >
              {isCreatingIssue ? "Creating Issue..." : "Create Issue"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

const CreateIssueForm = () => {
  return (
    <Suspense>
      <CreateIssueFormContent />
    </Suspense>
  )
}

export default CreateIssueForm
